import pytest
import sys, os
import networkx as nx
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from build_scores import (
    compute_score,
    get_edge_weight,
    classify_edge_type,
    count_arterial_crossings,
    compute_elevation_gain,
)


def _make_route(route_edge_names, side_arterials=None):
    """Build a MultiDiGraph and path for crossing tests.
    route_edge_names: names of edges along the route (len N -> N+1 nodes).
    side_arterials: list of (node_index, arterial_name) for adjacent-but-not-route arterials.
    Returns (G, path_nodes).
    """
    G = nx.MultiDiGraph()
    path = list(range(len(route_edge_names) + 1))
    for i, name in enumerate(route_edge_names):
        G.add_edge(i, i + 1, highway="residential", name=name, weight=2.0)
        G.add_edge(i + 1, i, highway="residential", name=name, weight=2.0)
    extra = len(path)
    for node_idx, art_name in (side_arterials or []):
        G.add_edge(node_idx, extra, highway="primary", name=art_name, weight=5.0)
        G.add_edge(extra, node_idx, highway="primary", name=art_name, weight=5.0)
        extra += 1
    return G, path


def test_score_returns_none_above_4_miles():
    assert compute_score(distance_mi=4.1, trail_pct=80, crossings=0, elevation_gain_m=0) is None
    assert compute_score(distance_mi=10,  trail_pct=100, crossings=0, elevation_gain_m=0) is None


def test_score_max_for_ideal_route():
    # 100*0.40 + 100*0.35 + 100*0.10 + 100*0.15 = 100
    assert compute_score(0.5, 100, 0, 0) == 100


def test_score_distance_tapers_linearly():
    # 0% trail, 2.5mi -> dist_score=50, 0 crossings, 0 elevation
    # 0*0.40 + 50*0.35 + 100*0.10 + 100*0.15 = 0+17.5+10+15 = 42.5
    # Python banker's rounding: round(42.5) = 42
    assert compute_score(2.5, 0, 0, 0) == 42


def test_score_crossing_penalty():
    # 100% trail, 0.5mi, 2 crossings -> crossing_score=50
    # 100*0.40 + 100*0.35 + 50*0.10 + 100*0.15 = 40+35+5+15 = 95
    assert compute_score(0.5, 100, 2, 0) == 95


def test_score_crossing_clamped_at_zero():
    # 0% trail, 0.5mi, 4 crossings -> crossing_score=0
    # 0*0.40 + 100*0.35 + 0*0.10 + 100*0.15 = 0+35+0+15 = 50
    assert compute_score(0.5, 0, 4, 0) == 50


def test_score_elevation_penalty():
    # 100% trail, 0.5mi, 0 crossings, 30m elevation -> terrain=40
    # 100*0.40 + 100*0.35 + 100*0.10 + 40*0.15 = 40+35+10+6 = 91
    assert compute_score(0.5, 100, 0, 30) == 91


def test_score_terrain_clamped_at_zero():
    # 0% trail, 0.5mi, 0 crossings, 50m elevation -> terrain=0
    # 0*0.40 + 100*0.35 + 100*0.10 + 0*0.15 = 0+35+10+0 = 45
    assert compute_score(0.5, 0, 0, 50) == 45


def test_edge_weight_path():
    assert get_edge_weight({"highway": "path"}) == 1.0
    assert get_edge_weight({"highway": "cycleway"}) == 0.8
    assert get_edge_weight({"highway": "footway"}) == 1.0


def test_edge_weight_residential():
    assert get_edge_weight({"highway": "residential"}) == 0.5
    assert get_edge_weight({"highway": "unclassified"}) == 0.5


def test_edge_weight_arterial():
    assert get_edge_weight({"highway": "primary"}) == 0.2
    assert get_edge_weight({"highway": "secondary"}) == 0.2


def test_classify_path_edges():
    assert classify_edge_type({"highway": "path"})     == "path"
    assert classify_edge_type({"highway": "cycleway"}) == "path"
    assert classify_edge_type({"highway": "footway"})  == "path"


def test_classify_residential_edges():
    assert classify_edge_type({"highway": "residential"})  == "residential"
    assert classify_edge_type({"highway": "unclassified"}) == "residential"
    assert classify_edge_type({"highway": "tertiary"})     == "residential"


def test_classify_arterial_edges():
    assert classify_edge_type({"highway": "primary"})   == "arterial"
    assert classify_edge_type({"highway": "secondary"}) == "arterial"
    assert classify_edge_type({"highway": "trunk"})     == "arterial"


def test_classify_arterial_by_name():
    assert classify_edge_type({"highway": "residential", "name": "Sawmill Road"})        == "arterial"
    assert classify_edge_type({"highway": "residential", "name": "Avery Road"})          == "arterial"
    assert classify_edge_type({"highway": "primary",     "name": "East Bridge Street"})  == "arterial"
    assert classify_edge_type({"highway": "primary",     "name": "West Dublin Granville Road"}) == "arterial"
    assert classify_edge_type({"highway": "primary",     "name": "West Dublin-Granville Road"}) == "arterial"


def test_count_crossings_zero():
    G, path = _make_route(["Trail", "Oak Lane"])
    assert count_arterial_crossings(G, path) == 0


def test_count_crossings_distinct_roads():
    # Route passes through two nodes that each intersect a distinct arterial
    G, path = _make_route(
        ["Oak Lane", "Oak Lane", "Oak Lane"],
        side_arterials=[(1, "Sawmill Road"), (2, "Avery Road")],
    )
    assert count_arterial_crossings(G, path) == 2


def test_count_crossings_same_road_counts_once():
    # Two nodes adjacent to the same arterial still count as 1 crossing
    G, path = _make_route(
        ["Oak Lane", "Oak Lane", "Oak Lane"],
        side_arterials=[(1, "Sawmill Road"), (2, "Sawmill Road")],
    )
    assert count_arterial_crossings(G, path) == 1


def test_count_crossings_max_five():
    G, path = _make_route(
        ["Oak Lane"] * 7,
        side_arterials=[
            (1, "Sawmill Road"),
            (2, "East Bridge Street"),   # SR-161
            (3, "Avery Road"),
            (4, "Hyland Croy Road"),
            (5, "Hard Road"),
            (6, "Some Other Big Road"),  # would be 6th but capped
        ],
    )
    assert count_arterial_crossings(G, path) == 5


def test_elevation_gain_flat():
    assert compute_elevation_gain([100.0, 100.5, 100.2, 100.8]) == pytest.approx(1.1, abs=0.5)


def test_elevation_gain_ignores_descents():
    assert compute_elevation_gain([0.0, 10.0, 5.0]) == pytest.approx(10.0, abs=0.1)


def test_elevation_gain_single_point():
    assert compute_elevation_gain([100.0]) == 0.0
