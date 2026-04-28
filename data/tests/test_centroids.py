import pytest
from unittest.mock import MagicMock
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from build_centroids import parse_names, build_query, parse_location


def test_parse_names_strips_blanks_and_comments():
    lines = ["Muirfield Village\n", "\n", "# a comment\n", "  Ballantrae  \n"]
    assert parse_names(lines) == ["Muirfield Village", "Ballantrae"]


def test_build_query_primary():
    assert build_query("Muirfield Village", primary=True) == "Muirfield Village, Dublin, OH"


def test_build_query_fallback():
    assert build_query("Muirfield Village", primary=False) == "Muirfield Village, Ohio"


def test_parse_location_returns_lat_lng():
    mock_loc = MagicMock()
    mock_loc.latitude = 40.09
    mock_loc.longitude = -83.11
    lat, lng = parse_location(mock_loc)
    assert lat == pytest.approx(40.09)
    assert lng == pytest.approx(-83.11)


def test_parse_location_returns_none_for_none():
    assert parse_location(None) == (None, None)
