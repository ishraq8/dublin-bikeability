"""Stage 3: compute bikeability scores for every neighborhood × school pair."""
import json
import os
import shutil
import sys

import networkx as nx
import osmnx as ox
import srtm

GRAPH_PATH     = os.path.join(os.path.dirname(__file__), "dublin_graph.graphml")
CENTROIDS_PATH = os.path.join(os.path.dirname(__file__), "centroids.json")
OUTPUT_PATH    = os.path.join(os.path.dirname(__file__), "scores.json")
REACT_OUTPUT   = os.path.join(os.path.dirname(__file__), "..", "src", "data", "scores.json")

SCHOOLS = {
    "scioto":  {"lat": 40.11974, "lng": -83.09762},  # 4000 Hard Rd
    "coffman": {"lat": 40.10822, "lng": -83.12956},  # 6780 Coffman Rd
    "jerome":  {"lat": 40.13493, "lng": -83.17589},  # 8300 Hyland-Croy Rd
}

ARTERIAL_NAMES   = {"sawmill", "sr-161", "state route 161", "bridge street", "dublin granville", "dublin-granville", "avery", "hyland croy", "hard"}
PATH_TAGS        = {"path", "footway", "pedestrian"}
CYCLEWAY_TAGS    = {"cycleway"}
RESIDENTIAL_TAGS = {"residential", "unclassified", "tertiary", "living_street"}
ARTERIAL_TAGS    = {"primary", "secondary", "trunk", "motorway"}

METERS_PER_MILE = 1609.344


def compute_score(distance_mi: float, trail_pct: float, crossings: int, elevation_gain_m: float):
    if distance_mi > 4:
        return None
    distance_score = 100.0 if distance_mi <= 1 else ((4 - distance_mi) / 3) * 100
    crossing_score = max(0.0, 100 - crossings * 25)
    terrain_score  = max(0.0, 100 - elevation_gain_m * 2)
    return round(trail_pct * 0.40 + distance_score * 0.35 + crossing_score * 0.10 + terrain_score * 0.15)


def get_edge_weight(data: dict) -> float:
    hw = data.get("highway", "")
    if isinstance(hw, list):
        hw = hw[0]
    if hw in PATH_TAGS:
        return 1.0
    if hw in CYCLEWAY_TAGS:
        return 0.8
    if hw in RESIDENTIAL_TAGS:
        return 0.5
    return 0.2


def classify_edge_type(data: dict) -> str:
    hw = data.get("highway", "")
    if isinstance(hw, list):
        hw = hw[0]
    name = str(data.get("name", "")).lower()
    if any(a in name for a in ARTERIAL_NAMES):
        return "arterial"
    if hw in PATH_TAGS | CYCLEWAY_TAGS:
        return "path"
    if hw in ARTERIAL_TAGS:
        return "arterial"
    return "residential"


def _edge_names(data: dict) -> set[str]:
    raw = data.get("name", "") or ""
    if isinstance(raw, list):
        return {str(r).lower() for r in raw}
    return {str(raw).lower()}


def count_arterial_crossings(G, path_nodes: list) -> int:
    """Count distinct arterials the route crosses (passes through, not travels along)."""
    if len(path_nodes) < 3:
        return 0

    crossed: set[str] = set()

    for i in range(1, len(path_nodes) - 1):
        node = path_nodes[i]

        # Names of the two route edges touching this node
        route_names: set[str] = set()
        for u, v in [(path_nodes[i - 1], node), (node, path_nodes[i + 1])]:
            best = min(G[u][v].values(), key=lambda d: d.get("weight", 1))
            route_names |= _edge_names(best)

        # Scan all adjacent edges in both directions for arterials
        for nbr in set(G.successors(node)) | set(G.predecessors(node)):
            edges_here = (
                list(G[node][nbr].values()) if G.has_edge(node, nbr) else []
            ) + (
                list(G[nbr][node].values()) if G.has_edge(nbr, node) else []
            )
            for edata in edges_here:
                for ename in _edge_names(edata):
                    for arterial in ARTERIAL_NAMES:
                        if arterial in ename and not any(arterial in rn for rn in route_names):
                            crossed.add(arterial)

    return min(len(crossed), 5)


def compute_elevation_gain(elevations: list[float]) -> float:
    gain = 0.0
    for i in range(1, len(elevations)):
        delta = elevations[i] - elevations[i - 1]
        if delta > 0:
            gain += delta
    return gain


def add_edge_weights(G) -> None:
    lengths = [
        min(G[u][v][k].get("length", 0) for k in G[u][v])
        for u, v in G.edges()
    ]
    avg_len = sum(lengths) / len(lengths) if lengths else 96.0
    for u, v, k, data in G.edges(keys=True, data=True):
        pref = 1.0 / get_edge_weight(data)
        norm_len = data.get("length", avg_len) / avg_len
        # 70% trail preference + 30% physical distance to avoid unnecessarily long detours
        data["weight"] = 0.7 * pref + 0.3 * norm_len


def get_route_edges(G, path_nodes: list) -> list[dict]:
    edges = []
    for u, v in zip(path_nodes[:-1], path_nodes[1:]):
        data = min(G[u][v].values(), key=lambda d: d.get("weight", 1))
        edges.append(data)
    return edges


def compute_trail_pct(edges: list[dict]) -> float:
    if not edges:
        return 0.0
    trail_count = sum(1 for e in edges if classify_edge_type(e) == "path")
    return round(trail_count / len(edges) * 100)


def get_route_length_miles(G, path_nodes: list) -> float:
    total_m = sum(
        min(G[u][v][k].get("length", 0) for k in G[u][v])
        for u, v in zip(path_nodes[:-1], path_nodes[1:])
    )
    return total_m / METERS_PER_MILE


def get_route_coords(G, path_nodes: list, edges: list[dict]) -> list:
    coords = []
    for node, edge_data in zip(path_nodes, edges + [{}]):
        nd = G.nodes[node]
        edge_type = classify_edge_type(edge_data) if edge_data else "residential"
        coords.append([nd["y"], nd["x"], edge_type])
    return coords


def get_node_elevations(G, path_nodes: list, elevation_data) -> list[float]:
    elevs = []
    for node in path_nodes:
        nd = G.nodes[node]
        e = elevation_data.get_elevation(nd["y"], nd["x"])
        elevs.append(e if e is not None else 0.0)
    return elevs


def score_pair(G, elevation_data, centroid: dict, school: dict) -> dict:
    try:
        orig = ox.distance.nearest_nodes(G, centroid["lng"], centroid["lat"])
        dest = ox.distance.nearest_nodes(G, school["lng"], school["lat"])
        path = nx.shortest_path(G, orig, dest, weight="weight")
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return {"score": None, "distanceMi": None, "trailPct": None,
                "crossings": None, "elevationGainM": None, "routeCoords": None}

    edges         = get_route_edges(G, path)
    distance_mi   = get_route_length_miles(G, path)
    trail_pct     = compute_trail_pct(edges)
    crossings     = count_arterial_crossings(G, path)
    elevations    = get_node_elevations(G, path, elevation_data)
    elev_gain     = round(compute_elevation_gain(elevations))
    score         = compute_score(distance_mi, trail_pct, crossings, elev_gain)
    route_coords  = get_route_coords(G, path, edges) if score is not None else None

    return {
        "score":          score,
        "distanceMi":     round(distance_mi, 2),
        "trailPct":       trail_pct,
        "crossings":      crossings,
        "elevationGainM": elev_gain,
        "routeCoords":    route_coords,
    }


def main() -> None:
    print("Loading graph...")
    G = ox.load_graphml(GRAPH_PATH)
    add_edge_weights(G)

    with open(CENTROIDS_PATH) as f:
        centroids = json.load(f)

    valid = [c for c in centroids if c["lat"] is not None]
    print(f"{len(valid)}/{len(centroids)} centroids valid")

    print("Loading SRTM elevation data...")
    elevation_data = srtm.get_data()

    results = []
    for i, centroid in enumerate(valid, 1):
        name = centroid["name"]
        slug = name.lower().replace(" ", "-").replace("/", "-")
        print(f"  [{i}/{len(valid)}] {name}")
        schools_out = {}
        for school_key, school in SCHOOLS.items():
            schools_out[school_key] = score_pair(G, elevation_data, centroid, school)
        results.append({
            "id":            slug,
            "name":          name,
            "region":        "Dublin City",
            "current_hs":    None,
            "redistricting": False,
            "lat":           centroid["lat"],
            "lng":           centroid["lng"],
            "includes":      [name],
            "schools":       schools_out,
        })

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nScores written -> {OUTPUT_PATH}")

    os.makedirs(os.path.dirname(os.path.abspath(REACT_OUTPUT)), exist_ok=True)
    shutil.copy(OUTPUT_PATH, REACT_OUTPUT)
    print(f"Copied -> {REACT_OUTPUT}")


if __name__ == "__main__":
    main()
