"""Stage 1: download the bike-legal osmnx graph and cache to dublin_graph.graphml."""
import os
import osmnx as ox

GRAPH_PATH = os.path.join(os.path.dirname(__file__), "dublin_graph.graphml")

BBOX = (-83.20, 40.05, -83.00, 40.20)  # west, south, east, north (osmnx 2.x: left, bottom, right, top)


def download_graph() -> None:
    print("Downloading osmnx graph for Dublin OH bounding box...")
    cf = (
        '["highway"~"path|cycleway|footway|pedestrian|residential|'
        'unclassified|tertiary|living_street|primary|secondary|trunk"]'
    )
    G = ox.graph_from_bbox(
        BBOX,
        network_type="all",
        custom_filter=cf,
        retain_all=False,
    )
    ox.save_graphml(G, GRAPH_PATH)
    print(f"Graph saved: {len(G.nodes)} nodes, {len(G.edges)} edges -> {GRAPH_PATH}")


if __name__ == "__main__":
    if os.path.exists(GRAPH_PATH):
        print(f"Graph already cached at {GRAPH_PATH}. Delete it to re-download.")
    else:
        download_graph()
