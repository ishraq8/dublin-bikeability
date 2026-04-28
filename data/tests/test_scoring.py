import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from build_scores import (
    compute_score,
    get_edge_weight,
    classify_edge_type,
    count_arterial_crossings,
    compute_elevation_gain,
)


def test_score_returns_none_above_4_miles():
    assert compute_score(4.1, 80, 0, 0) is None
    assert compute_score(10, 100, 0, 0) is None


def test_score_max_for_ideal_route():
    assert compute_score(0.5, 100, 0, 0) == 100


def test_score_distance_tapers_linearly():
    # 0% trail, 2.5mi → dist_score=50, 0 crossings, 0 elevation
    # 0*0.4 + 50*0.25 + 100*0.25 + 100*0.10 = 47.5 → 48
    assert compute_score(2.5, 0, 0, 0) == 48


def test_score_crossing_penalty():
    # 100% trail, 0.5mi, 2 crossings → crossing_score=50
    # 40+25+12.5+10 = 87.5 → 88
    assert compute_score(0.5, 100, 2, 0) == 88


def test_score_crossing_clamped_at_zero():
    # 0% trail, 0.5mi, 4 crossings → 0+25+0+10 = 35
    assert compute_score(0.5, 0, 4, 0) == 35


def test_score_elevation_penalty():
    # 100% trail, 0.5mi, 0 crossings, 30m → terrain=40 → 40+25+25+4 = 94
    assert compute_score(0.5, 100, 0, 30) == 94


def test_score_terrain_clamped_at_zero():
    # 0% trail, 0.5mi, 0 crossings, 50m → terrain=0 → 0+25+25+0 = 50
    assert compute_score(0.5, 0, 0, 50) == 50


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
    assert classify_edge_type({"highway": "residential", "name": "Sawmill Road"}) == "arterial"
    assert classify_edge_type({"highway": "residential", "name": "Avery Road"})   == "arterial"


def test_count_crossings_zero():
    assert count_arterial_crossings([{"highway": "path"}, {"highway": "residential"}]) == 0


def test_count_crossings_distinct_roads():
    edges = [
        {"highway": "primary", "name": "Sawmill Road"},
        {"highway": "primary", "name": "Sawmill Road"},
        {"highway": "primary", "name": "Avery Road"},
    ]
    assert count_arterial_crossings(edges) == 2


def test_count_crossings_max_five():
    edges = [
        {"highway": "primary", "name": "Sawmill Road"},
        {"highway": "primary", "name": "SR-161"},
        {"highway": "primary", "name": "Avery Road"},
        {"highway": "primary", "name": "Hyland Croy Road"},
        {"highway": "primary", "name": "Hard Road"},
    ]
    assert count_arterial_crossings(edges) == 5


def test_elevation_gain_flat():
    assert compute_elevation_gain([100.0, 100.5, 100.2, 100.8]) == pytest.approx(1.1, abs=0.5)


def test_elevation_gain_ignores_descents():
    assert compute_elevation_gain([0.0, 10.0, 5.0]) == pytest.approx(10.0, abs=0.1)


def test_elevation_gain_single_point():
    assert compute_elevation_gain([100.0]) == 0.0
