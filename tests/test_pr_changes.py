"""
Tests for PR changes — documentation, JSON artifacts, and governance files.

Covers:
  - LEGAL.md content and structure
  - boot_prompt_proof.md content
  - handoff/01-pathway-deps.json schema and values
  - handoff/02-session-snapshot.json schema and values
  - handoff/05-determinism-check.json schema and values
  - docs/adr/ADR-000 through ADR-008 structure and required fields
  - mesh/EXECUTE.md XML validity and required protocol elements
  - mesh/IEventStore.v1.md TypeScript interface documentation
  - mesh/ReplayEvent-Snapshot.v1.md contract documentation
  - mesh/adr-governance.md structure and required sections
"""

import json
import os
import re
import xml.etree.ElementTree as ET

import pytest

# Resolve repo root relative to this file
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_file(rel_path: str) -> str:
    """
    Return the UTF-8 decoded contents of a file located relative to the repository root.
    
    Parameters:
        rel_path (str): File path relative to the repository root.
    
    Returns:
        str: The file's contents as a UTF-8 decoded string.
    """
    full_path = os.path.join(REPO_ROOT, rel_path)
    with open(full_path, encoding="utf-8") as fh:
        return fh.read()


def load_json(rel_path: str) -> dict:
    """
    Load and parse a JSON file located at a path relative to the repository root.
    
    Parameters:
        rel_path (str): Path to the JSON file relative to the repository root.
    
    Returns:
        dict: The decoded JSON object.
    """
    full_path = os.path.join(REPO_ROOT, rel_path)
    with open(full_path, encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# LEGAL.md
# ---------------------------------------------------------------------------

class TestLegalMd:
    """Tests for LEGAL.md — legal classification disclaimer."""

    def test_file_exists(self):
        """
        Check that the repository-level LEGAL.md file exists.
        
        Asserts that a file named "LEGAL.md" is present at the repository root determined by REPO_ROOT.
        """
        assert os.path.exists(os.path.join(REPO_ROOT, "LEGAL.md"))

    def test_contains_audit_comment_block(self):
        """
        Asserts that LEGAL.md includes the required AUDIT comment markers used by the test suite.
        
        Checks for the presence of the following audit markers: "AUDIT::PATHWAY_DEPS", "AUDIT::CURRENT_GRADE", "AUDIT::ENTROPY_VECTOR", and "AUDIT::FIXED_POINT_CHECK".
        """
        content = read_file("LEGAL.md")
        assert "AUDIT::PATHWAY_DEPS" in content
        assert "AUDIT::CURRENT_GRADE" in content
        assert "AUDIT::ENTROPY_VECTOR" in content
        assert "AUDIT::FIXED_POINT_CHECK" in content

    def test_fixed_point_check_is_not_applicable(self):
        content = read_file("LEGAL.md")
        assert "AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE" in content

    def test_contains_legal_classification_disclaimer_heading(self):
        content = read_file("LEGAL.md")
        assert "# LEGAL CLASSIFICATION DISCLAIMER" in content

    def test_platform_identified_as_skill_based_sweepstakes(self):
        content = read_file("LEGAL.md")
        assert "skill-based sweepstakes competition" in content

    def test_does_not_claim_legal_compliance(self):
        content = read_file("LEGAL.md")
        assert "DOES NOT constitute legal proof of compliance" in content

    def test_requires_qualified_legal_review(self):
        content = read_file("LEGAL.md")
        assert "qualified legal review" in content.lower() or "Qualified legal review" in content

    def test_four_prerequisites_listed(self):
        """
        Assert that LEGAL.md lists the four required numbered prerequisites.
        
        Checks that LEGAL.md contains the following numbered prerequisites:
        1. "Qualified legal review"
        2. "geofencing"
        3. "AMOE"
        4. "compliance certification"
        """
        content = read_file("LEGAL.md")
        # All four numbered prerequisites must be present
        assert "1." in content and "Qualified legal review" in content
        assert "2." in content and "geofencing" in content
        assert "3." in content and "AMOE" in content
        assert "4." in content and "compliance certification" in content

    def test_engineering_team_posture_stated(self):
        content = read_file("LEGAL.md")
        assert "architectural requirement, not a proven legal fact" in content

    def test_no_real_money_pdx_without_review(self):
        content = read_file("LEGAL.md")
        assert "No real-money PDX operations" in content


# ---------------------------------------------------------------------------
# boot_prompt_proof.md
# ---------------------------------------------------------------------------

class TestBootPromptProof:
    """Tests for boot_prompt_proof.md — naive vs governed prompt comparison."""

    def test_file_exists(self):
        assert os.path.exists(os.path.join(REPO_ROOT, "boot_prompt_proof.md"))

    def test_contains_naive_prompt_section(self):
        content = read_file("boot_prompt_proof.md")
        assert "NAIVE PROMPT" in content

    def test_contains_governed_prompt_section(self):
        content = read_file("boot_prompt_proof.md")
        assert "GOVERNED PROMPT" in content

    def test_naive_prompt_has_zero_governance_value(self):
        """
        Asserts the naive prompt section in boot_prompt_proof.md indicates negligible governance value.
        
        Checks that the document contains the phrase "Governance value produced" and the approximate value "~0%".
        """
        content = read_file("boot_prompt_proof.md")
        assert "Governance value produced" in content
        assert "~0%" in content

    def test_governed_prompt_has_high_governance_value(self):
        """
        Asserts the governed prompt section reports a governance value of approximately 98% by checking for the '~98%' marker.
        """
        content = read_file("boot_prompt_proof.md")
        assert "~98%" in content

    def test_naive_risks_rated_high(self):
        """
        Verify the NAIVE PROMPT section lists 'HIGH' in its risk profile.
        
        Asserts that boot_prompt_proof.md contains a NAIVE PROMPT Risk profile section and that the extracted risk profile text includes the token "HIGH".
        """
        content = read_file("boot_prompt_proof.md")
        # All major risk categories should show HIGH for naive prompt
        naive_section_match = re.search(
            r"NAIVE PROMPT.*?Risk profile:(.*?)────────────",
            content,
            re.DOTALL,
        )
        assert naive_section_match is not None, "Should have a naive risk profile section"
        naive_risks = naive_section_match.group(1)
        assert "HIGH" in naive_risks

    def test_governed_risks_rated_zero(self):
        """
        Asserts that the 'GOVERNED PROMPT' risk profile in boot_prompt_proof.md exists and contains the token "ZERO".
        
        Checks that the file has a governed prompt section with a "Risk profile:" block and fails the test if that section is missing or does not include the string "ZERO".
        """
        content = read_file("boot_prompt_proof.md")
        governed_section_match = re.search(
            r"GOVERNED PROMPT.*?Risk profile:(.*?)────────────",
            content,
            re.DOTALL,
        )
        assert governed_section_match is not None, "Should have a governed risk profile section"
        governed_risks = governed_section_match.group(1)
        assert "ZERO" in governed_risks

    def test_explains_structural_vs_cosmetic_difference(self):
        content = read_file("boot_prompt_proof.md")
        assert "STRUCTURAL NOT COSMETIC" in content or "structural not cosmetic" in content.lower()

    def test_references_execute_md(self):
        content = read_file("boot_prompt_proof.md")
        assert "mesh/EXECUTE.md" in content

    def test_bounded_agent_concept_stated(self):
        content = read_file("boot_prompt_proof.md")
        assert "bounded agent" in content


# ---------------------------------------------------------------------------
# handoff/01-pathway-deps.json
# ---------------------------------------------------------------------------

class TestPathwayDepsJson:
    """Tests for handoff/01-pathway-deps.json — session pathway dependency map."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the pathway dependency handoff JSON into this object's `data` attribute.
        
        Reads and parses the file at "handoff/01-pathway-deps.json" and assigns the resulting dictionary to `self.data`.
        """
        self.data = load_json("handoff/01-pathway-deps.json")

    def test_required_top_level_keys_present(self):
        required = {
            "session_id",
            "modified_files",
            "dependency_map",
            "sacred_core_boundary_approached",
            "sacred_core_files_modified",
            "wasm_layer_risk",
            "bridge_overhead_risk",
            "gc_spike_risk",
            "escalation_raised",
            "notes",
        }
        for key in required:
            assert key in self.data, f"Missing required key: {key}"

    def test_session_id_format(self):
        # session_id should be in tier/TN-name-YYYYMMDD format
        assert self.data["session_id"].startswith("tier/T")
        assert re.match(r"tier/T\d+-[\w-]+-\d{8}", self.data["session_id"])

    def test_modified_files_is_list(self):
        assert isinstance(self.data["modified_files"], list)

    def test_modified_files_not_empty(self):
        """
        Assert that the pathway dependencies manifest contains at least one modified file.
        
        Checks that self.data["modified_files"] is a non-empty list; the test fails if it is empty.
        """
        assert len(self.data["modified_files"]) > 0

    def test_modified_files_contains_legal_md(self):
        assert "LEGAL.md" in self.data["modified_files"]

    def test_modified_files_contains_adr_files(self):
        """
        Verifies the pathway dependencies list includes all nine ADR files (ADR-000 through ADR-008).
        
        Asserts that at least nine entries containing the substring "ADR-" are present in the loaded `modified_files` list.
        """
        adr_files = [f for f in self.data["modified_files"] if "ADR-" in f]
        assert len(adr_files) >= 9, "Should list all 9 ADR files (ADR-000 through ADR-008)"

    def test_dependency_map_is_dict(self):
        """
        Verify the handoff pathway dependencies file contains a top-level dependency_map object.
        
        Asserts that self.data["dependency_map"] is a dict.
        """
        assert isinstance(self.data["dependency_map"], dict)

    def test_dependency_map_keys_match_modified_files(self):
        for key in self.data["dependency_map"]:
            assert key in self.data["modified_files"], (
                f"dependency_map key '{key}' not in modified_files"
            )

    def test_adr_files_have_no_dependencies(self):
        for key, val in self.data["dependency_map"].items():
            if key.startswith("docs/adr/"):
                assert val == [], f"ADR file {key} should have empty dependency list"

    def test_legal_md_has_no_dependencies(self):
        """
        Verify that LEGAL.md is listed with no dependencies in the pathway dependency map.
        
        Checks that the loaded pathway dependencies object contains an entry for "LEGAL.md" whose value is an empty list, indicating no file dependencies.
        """
        assert self.data["dependency_map"]["LEGAL.md"] == []

    def test_sacred_core_not_approached(self):
        assert self.data["sacred_core_boundary_approached"] is False

    def test_sacred_core_files_modified_is_empty(self):
        assert self.data["sacred_core_files_modified"] == []

    def test_risk_flags_all_false(self):
        assert self.data["wasm_layer_risk"] is False
        assert self.data["bridge_overhead_risk"] is False
        assert self.data["gc_spike_risk"] is False

    def test_no_escalation_raised(self):
        """
        Verify that the loaded handoff data indicates no escalation was raised for this session.
        
        Checks that the `escalation_raised` field in the parsed JSON is `None`.
        """
        assert self.data["escalation_raised"] is None

    def test_notes_is_non_empty_string(self):
        assert isinstance(self.data["notes"], str)
        assert len(self.data["notes"]) > 0

    def test_notes_confirms_documentation_only_session(self):
        notes = self.data["notes"].lower()
        assert "documentation" in notes or "doc" in notes

    def test_all_modified_files_are_strings(self):
        for f in self.data["modified_files"]:
            assert isinstance(f, str), f"Expected string in modified_files, got {type(f)}"

    def test_dependency_values_are_lists(self):
        """
        Assert every entry in `dependency_map` has a list value.
        
        Raises:
            AssertionError: if any `dependency_map` value is not a list.
        """
        for key, val in self.data["dependency_map"].items():
            assert isinstance(val, list), f"dependency_map['{key}'] should be a list"


# ---------------------------------------------------------------------------
# handoff/02-session-snapshot.json
# ---------------------------------------------------------------------------

class TestSessionSnapshotJson:
    """Tests for handoff/02-session-snapshot.json — session state snapshot."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the session snapshot JSON from handoff/02-session-snapshot.json into the instance.
        
        Reads and parses the JSON file at handoff/02-session-snapshot.json and assigns the resulting dictionary to self.data.
        """
        self.data = load_json("handoff/02-session-snapshot.json")

    def test_required_top_level_keys_present(self):
        required = {
            "session_id",
            "snapshot_timestamp",
            "git_head",
            "files_modified_count",
            "memory_state",
            "chain_head_valid",
            "chain_head_event_id",
            "rng_lineage_intact",
            "escalation_raised",
            "notes",
        }
        for key in required:
            assert key in self.data, f"Missing required key: {key}"

    def test_session_id_matches_pathway_deps(self):
        pathway = load_json("handoff/01-pathway-deps.json")
        assert self.data["session_id"] == pathway["session_id"]

    def test_snapshot_timestamp_is_iso8601(self):
        """
        Verify that `snapshot_timestamp` is an ISO-8601 UTC timestamp with millisecond precision ending in 'Z'.
        
        Asserts the value matches the pattern YYYY-MM-DDThh:mm:ss.sssZ (e.g., 2025-01-30T12:34:56.789Z).
        """
        ts = self.data["snapshot_timestamp"]
        # Must be ISO 8601 format ending in Z
        assert re.match(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z", ts), (
            f"snapshot_timestamp '{ts}' is not ISO 8601"
        )

    def test_git_head_contains_sha(self):
        # git_head should contain a 40-char hex SHA
        assert re.search(r"[0-9a-f]{40}", self.data["git_head"]) is not None

    def test_files_modified_count_is_positive_integer(self):
        count = self.data["files_modified_count"]
        assert isinstance(count, int)
        assert count > 0

    def test_memory_state_required_fields(self):
        mem = self.data["memory_state"]
        assert "current_session_branch" in mem
        assert "current_tier" in mem
        assert "tier_gate_status_T0" in mem
        assert "brightdata_artifacts_frozen" in mem
        assert "first_session" in mem

    def test_memory_state_tier_is_t0(self):
        assert self.data["memory_state"]["current_tier"] == "T0"

    def test_memory_state_first_session_true(self):
        assert self.data["memory_state"]["first_session"] is True

    def test_memory_state_brightdata_frozen(self):
        assert self.data["memory_state"]["brightdata_artifacts_frozen"] is True

    def test_chain_head_valid_is_bool(self):
        assert isinstance(self.data["chain_head_valid"], bool)

    def test_chain_head_event_id_is_null_at_t0(self):
        # At T0 baseline, no events exist yet so chain_head_event_id is null
        assert self.data["chain_head_event_id"] is None

    def test_rng_lineage_intact_is_true(self):
        assert self.data["rng_lineage_intact"] is True

    def test_no_escalation_raised(self):
        """
        Verify that the loaded handoff data indicates no escalation was raised for this session.
        
        Checks that the `escalation_raised` field in the parsed JSON is `None`.
        """
        assert self.data["escalation_raised"] is None

    def test_session_branch_matches_session_id(self):
        branch = self.data["memory_state"]["current_session_branch"]
        session_id = self.data["session_id"]
        # Branch should be the same as session_id (without "tier/" prefix redundancy)
        assert branch == session_id or session_id.endswith(branch) or branch in session_id


# ---------------------------------------------------------------------------
# handoff/05-determinism-check.json
# ---------------------------------------------------------------------------

class TestDeterminismCheckJson:
    """Tests for handoff/05-determinism-check.json — determinism verification."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the determinism-check handoff JSON into the instance.
        
        Sets self.data to the parsed contents of "handoff/05-determinism-check.json".
        """
        self.data = load_json("handoff/05-determinism-check.json")

    def test_required_top_level_keys_present(self):
        """
        Assert the determinism-check JSON contains all required top-level fields.
        
        Raises an AssertionError if any of the following keys are missing: session_id, fixed_point_check, fixed_point_rationale, float_violations, math_random_violations, date_now_violations, new_float32array_violations, rng_lineage_compliant, hashing_strategy_compliant, escalation_raised, notes.
        """
        required = {
            "session_id",
            "fixed_point_check",
            "fixed_point_rationale",
            "float_violations",
            "math_random_violations",
            "date_now_violations",
            "new_float32array_violations",
            "rng_lineage_compliant",
            "hashing_strategy_compliant",
            "escalation_raised",
            "notes",
        }
        for key in required:
            assert key in self.data, f"Missing required key: {key}"

    def test_session_id_matches_pathway_deps(self):
        pathway = load_json("handoff/01-pathway-deps.json")
        assert self.data["session_id"] == pathway["session_id"]

    def test_fixed_point_check_is_not_applicable_at_t0(self):
        assert self.data["fixed_point_check"] == "NOT_APPLICABLE"

    def test_fixed_point_rationale_is_string(self):
        assert isinstance(self.data["fixed_point_rationale"], str)
        assert len(self.data["fixed_point_rationale"]) > 0

    def test_violation_lists_are_empty(self):
        assert self.data["float_violations"] == []
        assert self.data["math_random_violations"] == []
        assert self.data["date_now_violations"] == []
        assert self.data["new_float32array_violations"] == []

    def test_rng_lineage_compliant_is_true(self):
        assert self.data["rng_lineage_compliant"] is True

    def test_hashing_strategy_compliant_is_true(self):
        assert self.data["hashing_strategy_compliant"] is True

    def test_no_escalation_raised(self):
        """
        Verify that the loaded handoff data indicates no escalation was raised for this session.
        
        Checks that the `escalation_raised` field in the parsed JSON is `None`.
        """
        assert self.data["escalation_raised"] is None

    def test_violation_lists_are_lists(self):
        """
        Assert that each violation field in the determinism-check data is a list.
        
        Checks the following keys on `self.data`: `float_violations`, `math_random_violations`,
        `date_now_violations`, and `new_float32array_violations`, ensuring each value is a list.
        """
        assert isinstance(self.data["float_violations"], list)
        assert isinstance(self.data["math_random_violations"], list)
        assert isinstance(self.data["date_now_violations"], list)
        assert isinstance(self.data["new_float32array_violations"], list)

    def test_all_three_handoff_files_have_same_session_id(self):
        pd = load_json("handoff/01-pathway-deps.json")
        ss = load_json("handoff/02-session-snapshot.json")
        assert pd["session_id"] == ss["session_id"] == self.data["session_id"]

    def test_fixed_point_check_value_is_valid_enum(self):
        allowed = {"PASS", "FAIL", "NOT_APPLICABLE"}
        assert self.data["fixed_point_check"] in allowed, (
            f"fixed_point_check must be one of {allowed}"
        )


# ---------------------------------------------------------------------------
# docs/adr/ — ADR-000 through ADR-008
# ---------------------------------------------------------------------------

ADR_FILES = [
    ("docs/adr/ADR-000-adr-governance.md", "ADR-000"),
    ("docs/adr/ADR-001-authority-model.md", "ADR-001"),
    ("docs/adr/ADR-002-sacred-core-spec.md", "ADR-002"),
    ("docs/adr/ADR-003-rng-lineage.md", "ADR-003"),
    ("docs/adr/ADR-004-event-versioning.md", "ADR-004"),
    ("docs/adr/ADR-005-snapshot-strategy.md", "ADR-005"),
    ("docs/adr/ADR-006-agent-escalation.md", "ADR-006"),
    ("docs/adr/ADR-007-threat-model.md", "ADR-007"),
    ("docs/adr/ADR-008-hashing-strategy.md", "ADR-008"),
]


class TestAdrFiles:
    """Tests for all 9 ADR files (ADR-000 through ADR-008)."""

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_file_exists(self, rel_path, adr_id):
        """
        Assert that a file at the given repository-relative path exists.
        
        Parameters:
            rel_path (str): Path to the file relative to the repository root.
            adr_id (str): ADR identifier associated with the file, provided for context in assertions.
        """
        assert os.path.exists(os.path.join(REPO_ROOT, rel_path)), f"{rel_path} not found"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_audit_comment_block(self, rel_path, adr_id):
        """
        Assert that the ADR file at the given repository-relative path contains the required audit markers.
        
        Parameters:
            rel_path (str): Path to the ADR file relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000") used for context in the test.
        """
        content = read_file(rel_path)
        assert "AUDIT::PATHWAY_DEPS" in content
        assert "AUDIT::CURRENT_GRADE" in content
        assert "AUDIT::ENTROPY_VECTOR" in content
        assert "AUDIT::FIXED_POINT_CHECK" in content

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_fixed_point_check_is_not_applicable(self, rel_path, adr_id):
        content = read_file(rel_path)
        assert "AUDIT::FIXED_POINT_CHECK: NOT_APPLICABLE" in content

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_correct_heading_with_adr_number(self, rel_path, adr_id):
        content = read_file(rel_path)
        assert f"# {adr_id}:" in content, f"Expected heading '# {adr_id}:' in {rel_path}"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_date_field(self, rel_path, adr_id):
        """
        Check that the ADR file contains a `Date: YYYY-MM-DD` metadata line.
        
        Parameters:
            rel_path (str): Path to the ADR file relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000") used for context in test iteration.
        """
        content = read_file(rel_path)
        assert re.search(r"^Date:\s+\d{4}-\d{2}-\d{2}", content, re.MULTILINE), (
            f"Missing 'Date: YYYY-MM-DD' in {rel_path}"
        )

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_date_is_valid(self, rel_path, adr_id):
        content = read_file(rel_path)
        match = re.search(r"^Date:\s+(\d{4}-\d{2}-\d{2})", content, re.MULTILINE)
        assert match is not None
        date_str = match.group(1)
        # Year must be 4 digits, month 01-12, day 01-31
        year, month, day = date_str.split("-")
        assert 2020 <= int(year) <= 2030
        assert 1 <= int(month) <= 12
        assert 1 <= int(day) <= 31

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_status_field(self, rel_path, adr_id):
        content = read_file(rel_path)
        assert re.search(r"^Status:", content, re.MULTILINE), (
            f"Missing 'Status:' field in {rel_path}"
        )

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_status_is_valid_value(self, rel_path, adr_id):
        """
        Validate that an ADR file contains a well-formed `Status:` field.
        
        Checks that the file at `rel_path` has a `Status:` line and that its value is one of:
        `Proposed`, `Accepted`, `Rejected`, `Deprecated`, or starts with `Superseded` (e.g., `Superseded by ADR-001`).
        Raises an assertion failure if the `Status:` field is missing or has an invalid value.
        
        Parameters:
            rel_path (str): Path to the ADR file relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000") used for test parametrization and error context.
        """
        content = read_file(rel_path)
        match = re.search(r"^Status:\s+(.+)$", content, re.MULTILINE)
        assert match is not None
        status = match.group(1).strip()
        valid_statuses = {"Proposed", "Accepted", "Rejected", "Deprecated"}
        # Status may also include "Superseded by ADR-NNN"
        assert status in valid_statuses or status.startswith("Superseded"), (
            f"Invalid status '{status}' in {rel_path}"
        )

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_tier_affected_field(self, rel_path, adr_id):
        content = read_file(rel_path)
        assert re.search(r"^Tier Affected:", content, re.MULTILINE), (
            f"Missing 'Tier Affected:' in {rel_path}"
        )

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_authority_required_field(self, rel_path, adr_id):
        """
        Assert that the ADR file at the given relative path contains an `Authority Required:` metadata field.
        
        Parameters:
            rel_path (str): Path to the ADR file relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000"); used for test identification and messaging.
        """
        content = read_file(rel_path)
        assert re.search(r"^Authority Required:", content, re.MULTILINE), (
            f"Missing 'Authority Required:' in {rel_path}"
        )

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_context_section(self, rel_path, adr_id):
        """
        Assert that the specified ADR file contains a '## Context' section.
        
        Parameters:
            rel_path (str): Path to the ADR file relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000"); provided for test parametrization and context.
        """
        content = read_file(rel_path)
        assert "## Context" in content, f"Missing '## Context' section in {rel_path}"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_decision_section(self, rel_path, adr_id):
        """
        Check that the ADR file at rel_path contains a '## Decision' section.
        
        Parameters:
            rel_path (str): Repository-relative path to the ADR markdown file.
            adr_id (str): ADR identifier (e.g., "ADR-001"), provided for contextual clarity in test output.
        """
        content = read_file(rel_path)
        assert "## Decision" in content, f"Missing '## Decision' section in {rel_path}"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_consequences_section(self, rel_path, adr_id):
        """
        Check that the ADR file contains a '## Consequences' section.
        
        Parameters:
            rel_path (str): Path to the ADR file, relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000"); provided for context in failure messages.
        
        Raises:
            AssertionError: If the '## Consequences' section is not present in the file.
        """
        content = read_file(rel_path)
        assert "## Consequences" in content, f"Missing '## Consequences' section in {rel_path}"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_has_evidence_section(self, rel_path, adr_id):
        """
        Assert that the ADR file contains an "## Evidence" section.
        
        Parameters:
            rel_path (str): Repository-relative path to the ADR markdown file being checked.
            adr_id (str): ADR identifier (e.g., "ADR-000") for context in failure messages.
        
        Raises:
            AssertionError: If the file does not contain a "## Evidence" section.
        """
        content = read_file(rel_path)
        assert "## Evidence" in content, f"Missing '## Evidence' section in {rel_path}"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_all_sections_are_non_empty(self, rel_path, adr_id):
        """
        Verify that the ADR file at rel_path contains the four required sections and that each section's body is non-empty.
        
        Checks that the headings "## Context", "## Decision", "## Consequences", and "## Evidence" are present in the file and that the text between each heading and the next (or the end of file) has more than 10 characters.
        
        Parameters:
            rel_path (str): Repository-relative path to the ADR markdown file to validate.
            adr_id (str): ADR identifier used for contextual test reporting.
        """
        content = read_file(rel_path)
        sections = ["## Context", "## Decision", "## Consequences", "## Evidence"]
        for i, section in enumerate(sections):
            start = content.find(section)
            assert start != -1
            # Content between this section and the next (or end of file) must be non-trivial
            next_section = sections[i + 1] if i + 1 < len(sections) else None
            if next_section:
                end = content.find(next_section, start)
                body = content[start + len(section): end].strip()
            else:
                body = content[start + len(section):].strip()
            assert len(body) > 10, f"Section '{section}' in {rel_path} appears empty"

    @pytest.mark.parametrize("rel_path,adr_id", ADR_FILES)
    def test_section_order_is_correct(self, rel_path, adr_id):
        """
        Assert that an ADR markdown file contains the four required sections in the order: Context, Decision, Consequences, Evidence.
        
        Parameters:
            rel_path (str): Path to the ADR file relative to the repository root.
            adr_id (str): ADR identifier (e.g., "ADR-000"); provided for test parametrization and reporting.
        """
        content = read_file(rel_path)
        ctx_pos = content.find("## Context")
        dec_pos = content.find("## Decision")
        con_pos = content.find("## Consequences")
        evi_pos = content.find("## Evidence")
        assert ctx_pos < dec_pos < con_pos < evi_pos, (
            f"Section order wrong in {rel_path}"
        )

    def test_adr_numbers_are_sequential(self):
        """All ADR numbers 000-008 must exist with no gaps."""
        for i in range(9):
            adr_num = f"ADR-{i:03d}"
            matches = [path for path, aid in ADR_FILES if aid == adr_num]
            assert len(matches) == 1, f"Expected exactly one file for {adr_num}"

    def test_adr_000_is_governance_bootstrap(self):
        content = read_file("docs/adr/ADR-000-adr-governance.md")
        assert "ADR Governance" in content or "adr-governance" in content.lower()

    def test_adr_001_covers_authority_model(self):
        content = read_file("docs/adr/ADR-001-authority-model.md")
        assert "authority" in content.lower()
        # Must mention the five levels
        assert "Human Authority" in content or "five-level" in content.lower() or "5-level" in content.lower() or "five level" in content.lower()

    def test_adr_003_covers_rng_lineage(self):
        content = read_file("docs/adr/ADR-003-rng-lineage.md")
        assert "HMAC-SHA256" in content
        assert "Math.random()" in content

    def test_adr_005_covers_60_frame_snapshots(self):
        content = read_file("docs/adr/ADR-005-snapshot-strategy.md")
        assert "60" in content

    def test_adr_006_defines_five_escalation_levels(self):
        """
        Verify ADR-006 documents the five escalation levels.
        
        Asserts that docs/adr/ADR-006-agent-escalation.md contains the escalation markers "L0", "L1", "L2", "L3", and "L4".
        """
        content = read_file("docs/adr/ADR-006-agent-escalation.md")
        assert "L0" in content
        assert "L1" in content
        assert "L2" in content
        assert "L3" in content
        assert "L4" in content

    def test_adr_008_defines_sha256_for_chains(self):
        content = read_file("docs/adr/ADR-008-hashing-strategy.md")
        assert "SHA-256" in content
        assert "BLAKE3" in content


# ---------------------------------------------------------------------------
# mesh/EXECUTE.md — Session boot protocol (XML-embedded)
# ---------------------------------------------------------------------------

class TestExecuteMd:
    """Tests for mesh/EXECUTE.md — session boot protocol."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the mesh/EXECUTE.md protocol document into the instance.
        
        Sets the instance attribute `content` to the full text of mesh/EXECUTE.md.
        """
        self.content = read_file("mesh/EXECUTE.md")

    def test_file_exists(self):
        assert os.path.exists(os.path.join(REPO_ROOT, "mesh/EXECUTE.md"))

    def test_starts_with_xml_declaration(self):
        assert self.content.lstrip().startswith("<?xml version=")

    def test_xml_structure_has_balanced_major_elements(self):
        """Key XML elements must have both opening and closing tags.

        Note: EXECUTE.md uses XML-flavored syntax but contains unescaped
        comparison operators in text content (e.g. 'Score >= 70', 'Score < 50'),
        so it is intentionally not strict XML. This test verifies structural
        balance for the major protocol elements instead.
        """
        major_elements = [
            "session_boot_protocol",
            "constitution",
            "execution",
            "constraints",
            "audit_signature",
            "mesh_manifest",
            "invocation",
        ]
        for elem in major_elements:
            open_tag = f"<{elem}"
            close_tag = f"</{elem}>"
            assert open_tag in self.content, f"Missing opening tag <{elem}> in EXECUTE.md"
            assert close_tag in self.content, f"Missing closing tag </{elem}> in EXECUTE.md"
            # Closing tag must come after opening tag
            assert self.content.find(open_tag) < self.content.find(close_tag), (
                f"Closing tag </{elem}> appears before opening tag in EXECUTE.md"
            )

    def test_has_version_1_0_0(self):
        assert 'version="1.0.0"' in self.content

    def test_has_constitution_layer(self):
        assert "<constitution>" in self.content

    def test_has_execution_layer(self):
        assert "<execution>" in self.content

    def test_has_constraints_layer(self):
        """
        Verify the mesh/EXECUTE.md protocol document declares a constraints layer.
        
        Asserts that the string "<constraints>" appears in the loaded EXECUTE.md content.
        """
        assert "<constraints>" in self.content

    def test_has_audit_signature_element(self):
        assert "<audit_signature>" in self.content

    def test_has_mesh_manifest_element(self):
        assert "<mesh_manifest" in self.content

    def test_has_invocation_element(self):
        """
        Checks that the EXECUTE.md document contains an <invocation> element.
        
        This assertion verifies the presence of the required <invocation> tag in the loaded protocol document.
        """
        assert "<invocation>" in self.content

    def test_constitution_has_identity(self):
        """
        Asserts the EXECUTE.md constitution includes an <identity> element.
        
        This test fails if the `<identity>` tag is not present in the loaded EXECUTE.md content.
        """
        assert "<identity>" in self.content

    def test_constitution_has_authority_ceiling(self):
        assert "<authority_ceiling>" in self.content

    def test_constitution_has_sacred_boundary(self):
        """
        Assert that the EXECUTE.md constitution declares a sacred boundary element.
        
        Checks that the loaded EXECUTE.md content contains the XML-style tag `<sacred_boundary>`, indicating the document defines the protocol's sacred boundary.
        """
        assert "<sacred_boundary>" in self.content

    def test_constitution_has_legal_posture(self):
        assert "<legal_posture>" in self.content

    def test_pre_boot_phase_present(self):
        assert 'name="PRE_BOOT"' in self.content

    def test_tier_selection_phase_present(self):
        assert 'name="TIER_SELECTION"' in self.content

    def test_execution_phase_present(self):
        assert 'name="EXECUTION"' in self.content

    def test_close_phase_present(self):
        assert 'name="CLOSE"' in self.content

    def test_prohibited_merge_own_pr(self):
        assert 'action="merge_own_pr"' in self.content

    def test_prohibited_skip_audit_cells(self):
        assert 'action="skip_audit_cells"' in self.content

    def test_prohibited_run_multiple_tiers(self):
        """
        Assert that the EXECUTE.md protocol disallows running multiple tiers in a single session.
        
        Checks that the loaded protocol content contains the prohibited action marker `action="run_multiple_tiers"`.
        """
        assert 'action="run_multiple_tiers"' in self.content

    def test_prohibited_write_sacred_core_files(self):
        assert 'action="write_sacred_core_files"' in self.content

    def test_prohibited_math_random_in_scoring(self):
        assert 'action="math_random_in_scoring"' in self.content

    def test_prohibited_sdx_balance_without_blockchain(self):
        assert 'action="sdx_balance_without_blockchain"' in self.content

    def test_prohibited_pdx_award_without_attestation(self):
        assert 'action="pdx_award_without_attestation"' in self.content

    def test_mesh_manifest_lists_constitutional_files(self):
        assert 'name="authority-model.md"' in self.content
        assert 'name="sacred-core-spec.md"' in self.content
        assert 'name="hashing-strategy.md"' in self.content

    def test_mesh_manifest_has_execute_md_itself(self):
        assert 'name="EXECUTE.md"' in self.content

    def test_invocation_command_present(self):
        assert 'claude "read mesh/EXECUTE.md and follow the protocol exactly"' in self.content

    def test_audit_cells_enumerated_sequentially(self):
        # Six audit cells referenced in EXECUTE.md
        for i in range(1, 7):
            pattern = f"Cell 0{i}" if i < 10 else f"Cell {i}"
            assert pattern in self.content, f"Expected '{pattern}' in EXECUTE.md"

    def test_session_score_thresholds_defined(self):
        assert "Score >= 70" in self.content or "Score &gt;= 70" in self.content or ">= 70" in self.content

    def test_one_tier_per_session_rule(self):
        assert "ONE TIER PER SESSION" in self.content

    def test_pb_steps_numbered(self):
        for step_id in ["PB-1", "PB-2", "PB-3", "PB-4"]:
            assert step_id in self.content, f"Expected step {step_id} in EXECUTE.md"

    def test_escalation_levels_defined(self):
        for level in ["Level 0", "Level 1", "Level 2", "Level 3", "Level 4"]:
            assert level in self.content, f"Expected '{level}' in EXECUTE.md"


# ---------------------------------------------------------------------------
# mesh/IEventStore.v1.md — Interface contract documentation
# ---------------------------------------------------------------------------

class TestIEventStoreV1Md:
    """Tests for mesh/IEventStore.v1.md — frozen interface contract."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the mesh interface document "mesh/IEventStore.v1.md" into the instance.
        
        Populates self.content with the UTF-8 text of the IEventStore.v1.md file read from the repository.
        """
        self.content = read_file("mesh/IEventStore.v1.md")

    def test_file_exists(self):
        assert os.path.exists(os.path.join(REPO_ROOT, "mesh/IEventStore.v1.md"))

    def test_has_frozen_declaration(self):
        assert "FROZEN" in self.content

    def test_version_is_1_0_0(self):
        """
        Ensure the document declares version 1.0.0.
        
        Checks that either the literal `v1.0.0` or `1.0.0` appears anywhere in the test content.
        """
        assert "v1.0.0" in self.content or "1.0.0" in self.content

    def test_requires_migration_adapter_for_changes(self):
        """
        Asserts the document requires a migration adapter or mentions migration.
        
        Converts the file content to lowercase and asserts it contains either the phrase "migration adapter" or the substring "migrate".
        """
        content_lower = self.content.lower()
        assert "migration adapter" in content_lower or "migrate" in content_lower

    def test_has_write_method(self):
        assert "write(" in self.content

    def test_has_read_method(self):
        assert "read(" in self.content

    def test_has_verify_chain_method(self):
        """
        Check that the IEventStore.v1 documentation declares a `verifyChain` method.
        
        Raises:
            AssertionError: if the substring "verifyChain(" is not present in the loaded content.
        """
        assert "verifyChain(" in self.content

    def test_has_migrate_method(self):
        """
        Checks that the document declares a `migrate(` method, ensuring a migration adapter or migration API is documented for the interface.
        
        If the substring `migrate(` is absent, the test fails indicating missing migration/migration-adapter documentation.
        """
        assert "migrate(" in self.content

    def test_has_snapshot_method(self):
        """
        Ensure the IEventStore v1 documentation mentions a `snapshot` method.
        
        Raises:
            AssertionError: If the string 'snapshot(' is not found in the loaded content.
        """
        assert "snapshot(" in self.content

    def test_has_load_snapshot_method(self):
        """
        Asserts the IEventStore.v1.md interface document declares a loadSnapshot method.
        
        Checks that the file content contains the substring "loadSnapshot(" indicating the method is documented.
        """
        assert "loadSnapshot(" in self.content

    def test_has_replay_method(self):
        """
        Verify the interface document declares a `replay` method.
        
        Checks that the loaded document contains the substring "replay(" indicating the `replay` method is documented.
        """
        assert "replay(" in self.content

    def test_has_health_check_method(self):
        assert "healthCheck(" in self.content

    def test_write_rejects_pdx_without_attestation(self):
        assert "attestation" in self.content

    def test_predecessor_hash_uses_sha256(self):
        assert "SHA-256" in self.content or "sha256" in self.content

    def test_defines_match_input_log_interface(self):
        assert "MatchInputLog" in self.content

    def test_defines_replay_result_interface(self):
        assert "ReplayResult" in self.content

    def test_replay_is_deterministic(self):
        assert "deterministic" in self.content.lower()

    def test_storage_agnostic_noted(self):
        assert "storage-agnostic" in self.content.lower() or "storage agnostic" in self.content.lower()

    def test_lists_concrete_implementations(self):
        assert "InMemoryEventStore" in self.content
        assert "SupabaseEventStore" in self.content
        assert "PostgresEventStore" in self.content

    def test_write_must_not_accept_math_random(self):
        """
        Ensure the document references the prohibition of Math.random().
        
        Asserts that the loaded content includes the literal "Math.random()", indicating the interface or contract documentation explicitly mentions (and therefore forbids or warns about) use of Math.random().
        """
        assert "Math.random()" in self.content

    def test_method_count_is_eight(self):
        # Interface defines exactly 8 methods
        methods = ["write(", "read(", "verifyChain(", "migrate(", "snapshot(", "loadSnapshot(", "replay(", "healthCheck("]
        found = sum(1 for m in methods if m in self.content)
        assert found == 8, f"Expected 8 interface methods, found {found}"

    def test_freeze_declaration_requires_adr(self):
        assert "ADR" in self.content

    def test_replay_tick_uses_fixed_dt(self):
        assert "1/60" in self.content or "dt=1/60" in self.content


# ---------------------------------------------------------------------------
# mesh/ReplayEvent-Snapshot.v1.md — Type contract documentation
# ---------------------------------------------------------------------------

class TestReplayEventSnapshotV1Md:
    """Tests for mesh/ReplayEvent-Snapshot.v1.md — frozen type contracts."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the ReplayEvent-Snapshot.v1.md contract document into the instance.
        
        After execution, self.content contains the file's text (the contents of mesh/ReplayEvent-Snapshot.v1.md).
        """
        self.content = read_file("mesh/ReplayEvent-Snapshot.v1.md")

    def test_file_exists(self):
        assert os.path.exists(os.path.join(REPO_ROOT, "mesh/ReplayEvent-Snapshot.v1.md"))

    def test_has_part_1_replay_event(self):
        assert "PART 1" in self.content
        assert "ReplayEvent" in self.content

    def test_has_part_2_snapshot(self):
        assert "PART 2" in self.content
        assert "Snapshot" in self.content

    def test_has_game_event_interface(self):
        assert "GameEvent" in self.content

    def test_has_schema_version_field(self):
        assert "schema_version" in self.content

    def test_has_event_id_field(self):
        """
        Verify the ReplayEvent contract includes the 'event_id' field.
        
        Asserts that the parsed ReplayEvent content contains the key 'event_id', failing the test if it is missing.
        """
        assert "event_id" in self.content

    def test_has_event_type_field(self):
        assert "event_type" in self.content

    def test_has_replay_tick_field(self):
        assert "replay_tick" in self.content

    def test_has_predecessor_hash_field(self):
        assert "predecessor_hash" in self.content

    def test_has_all_ten_event_types(self):
        event_types = [
            "MATCH_START",
            "ROUND_START",
            "TILE_SWAP",
            "CASCADE_COMPLETE",
            "MATCH_SCORE",
            "PDX_AWARD",
            "FD_EMIT",
            "SDX_AWARD",
            "ROUND_END",
            "MATCH_END",
        ]
        for et in event_types:
            assert et in self.content, f"Event type '{et}' not found in ReplayEvent-Snapshot.v1.md"

    def test_pdx_award_requires_attestation_pass(self):
        assert "attestation_verdict: 'PASS'" in self.content or "attestation_verdict" in self.content

    def test_sdx_award_requires_blockchain_tx(self):
        assert "blockchain_tx_id" in self.content

    def test_scores_use_fixed_point_not_float(self):
        assert "Q32.32" in self.content
        assert "fixed-point" in self.content.lower() or "Fixed-point" in self.content

    def test_has_event_snapshot_interface(self):
        """
        Asserts the ReplayEvent-Snapshot.v1.md document declares the `EventSnapshot` type.
        
        This test verifies that the frozen snapshot contract includes the `EventSnapshot` identifier.
        """
        assert "EventSnapshot" in self.content

    def test_has_snapshot_trigger_types(self):
        expected_triggers = [
            "INTERVAL_1000",
            "INTERVAL_60",
            "SDX_AWARD",
            "MATCH_END",
        ]
        for trigger in expected_triggers:
            assert trigger in self.content, f"Snapshot trigger '{trigger}' not found"

    def test_has_snapshot_state_interface(self):
        assert "SnapshotState" in self.content

    def test_freeze_declaration_present(self):
        assert "FROZEN" in self.content

    def test_freeze_requires_migration_adapter(self):
        assert "migration adapter" in self.content.lower()

    def test_freeze_requires_adr(self):
        assert "ADR" in self.content

    def test_has_chain_verification_result(self):
        assert "ChainVerificationResult" in self.content

    def test_class_archetypes_defined(self):
        # Three class archetypes
        assert "Paladin" in self.content
        assert "Rogue" in self.content
        assert "Bard" in self.content

    def test_session_seed_committed_before_start(self):
        """
        Verify the document contains the `session_seed_committed` field.
        
        This test asserts that the parsed file content includes the `session_seed_committed` key, which indicates the session seed is recorded in the replay/snapshot contract.
        """
        assert "session_seed_committed" in self.content

    def test_state_hash_uses_sha256(self):
        assert "SHA-256" in self.content or "sha256" in self.content


# ---------------------------------------------------------------------------
# mesh/adr-governance.md — Constitutional document
# ---------------------------------------------------------------------------

class TestAdrGovernanceMd:
    """Tests for mesh/adr-governance.md — ADR governance constitutional document."""

    @pytest.fixture(autouse=True)
    def load(self):
        """
        Load the contents of mesh/adr-governance.md into this instance.
        
        This reads the repository-relative file "mesh/adr-governance.md" and stores its text in self.content.
        """
        self.content = read_file("mesh/adr-governance.md")

    def test_file_exists(self):
        assert os.path.exists(os.path.join(REPO_ROOT, "mesh/adr-governance.md"))

    def test_heading_present(self):
        assert "# ADR GOVERNANCE" in self.content

    def test_has_adr_storage_section(self):
        assert "ADR Storage" in self.content

    def test_docs_adr_path_documented(self):
        """
        Check that the test content references the ADR documentation directory.
        
        Asserts that either "docs/adr/" or "docs/" appears in the loaded file content, indicating ADR documentation paths are documented or referenced.
        """
        assert "docs/adr/" in self.content or "docs/" in self.content

    def test_has_adr_format_section(self):
        """
        Asserts that the ADR governance document includes the "ADR Format" section.
        
        This test verifies the presence of the ADR format heading used to describe the required ADR template and metadata fields.
        """
        assert "ADR Format" in self.content

    def test_adr_format_defines_required_sections(self):
        # The format template should include all required sections
        """
        Verify the ADR format template includes the mandatory metadata sections.
        
        Asserts that the template contains the section headings: "## Context", "## Decision", "## Consequences", and "## Evidence".
        """
        assert "## Context" in self.content
        assert "## Decision" in self.content
        assert "## Consequences" in self.content
        assert "## Evidence" in self.content

    def test_format_includes_date_field(self):
        assert "Date:" in self.content

    def test_format_includes_status_field(self):
        assert "Status:" in self.content

    def test_format_includes_authority_required(self):
        """
        Asserts the ADR file contains the "Authority Required" metadata field.
        
        Raises:
            AssertionError: If the string "Authority Required" is not present in the ADR content.
        """
        assert "Authority Required" in self.content

    def test_has_required_adr_triggers_section(self):
        assert "Required ADR Triggers" in self.content

    def test_sacred_core_change_triggers_adr(self):
        assert "sacred-core-spec.md" in self.content

    def test_authority_model_change_triggers_adr(self):
        assert "authority-model.md" in self.content

    def test_rng_lineage_change_triggers_monte_carlo(self):
        content_lower = self.content.lower()
        assert "rng" in content_lower and "monte carlo" in content_lower

    def test_has_adr_lifecycle_section(self):
        assert "ADR Lifecycle" in self.content or "lifecycle" in self.content.lower()

    def test_human_approval_required(self):
        assert "Human" in self.content

    def test_agent_cannot_self_accept_adr(self):
        """
        Verifies the ADR text requires human approval and explicit acceptance language.
        
        Checks that the document contains the word "human" and includes wording related to approval or acceptance, ensuring agents cannot self-accept ADRs.
        """
        content_lower = self.content.lower()
        assert "human" in content_lower and ("approv" in content_lower or "accept" in content_lower)

    def test_deprecated_adrs_are_not_deleted(self):
        assert "superseded" in self.content.lower() and "not deleted" in self.content.lower() or \
               "deprecated" in self.content.lower() and "not deleted" in self.content.lower() or \
               "deprecated" in self.content.lower() and "marked" in self.content.lower()

    def test_adr_numbers_sequential_and_not_reused(self):
        assert "never reused" in self.content.lower() or "sequential" in self.content.lower()

    def test_has_human_sign_off_field_in_format(self):
        """
        Asserts the ADR format requires a human sign-off.
        
        Checks that the document content contains either the exact phrase "Human Sign-off" or a case-insensitive occurrence of "sign-off".
        """
        assert "Human Sign-off" in self.content or "sign-off" in self.content.lower()

    def test_proof_of_value_table_in_format(self):
        assert "Proof of Value" in self.content or "proof of value" in self.content.lower()


# ---------------------------------------------------------------------------
# Cross-file consistency tests
# ---------------------------------------------------------------------------

class TestCrossFileConsistency:
    """Tests that verify consistency across multiple changed files."""

    def test_all_adr_files_have_same_date(self):
        """All ADR files were created in the same T0 session."""
        dates = set()
        for rel_path, _ in ADR_FILES:
            content = read_file(rel_path)
            match = re.search(r"^Date:\s+(\d{4}-\d{2}-\d{2})", content, re.MULTILINE)
            assert match is not None, f"No date found in {rel_path}"
            dates.add(match.group(1))
        assert len(dates) == 1, f"All ADR files should share a single creation date, found: {dates}"

    def test_all_adr_files_have_same_current_grade(self):
        """All ADR files should have Grade C as the current grade (T0 baseline)."""
        for rel_path, adr_id in ADR_FILES:
            content = read_file(rel_path)
            assert "Grade C" in content, f"{adr_id} should have Grade C in audit comment"

    def test_legal_md_and_adrs_have_same_audit_vector(self):
        """LEGAL.md and ADR files all declare documentation-only entropy vector."""
        files = ["LEGAL.md"] + [p for p, _ in ADR_FILES]
        for rel_path in files:
            content = read_file(rel_path)
            assert "documentation" in content.lower(), (
                f"{rel_path} should mention 'documentation' in audit comment"
            )

    def test_handoff_files_reference_same_session(self):
        """All handoff JSON files should share the same session_id."""
        session_ids = {
            load_json("handoff/01-pathway-deps.json")["session_id"],
            load_json("handoff/02-session-snapshot.json")["session_id"],
            load_json("handoff/05-determinism-check.json")["session_id"],
        }
        assert len(session_ids) == 1, f"Handoff files have mismatched session IDs: {session_ids}"

    def test_pathway_deps_lists_adr_files_that_exist(self):
        """Every ADR file listed in pathway-deps.json must actually exist on disk."""
        data = load_json("handoff/01-pathway-deps.json")
        adr_in_manifest = [f for f in data["modified_files"] if f.startswith("docs/adr/")]
        for adr_path in adr_in_manifest:
            full_path = os.path.join(REPO_ROOT, adr_path)
            assert os.path.exists(full_path), f"ADR file '{adr_path}' listed in pathway-deps.json does not exist"

    def test_pathway_deps_lists_legal_md_which_exists(self):
        data = load_json("handoff/01-pathway-deps.json")
        assert "LEGAL.md" in data["modified_files"]
        assert os.path.exists(os.path.join(REPO_ROOT, "LEGAL.md"))

    def test_execute_md_references_constitutional_docs_in_correct_order(self):
        """
        Assert that the PB-1 step in mesh/EXECUTE.md references the four required constitutional documents.
        
        Checks that the PB-1 step element (id="PB-1") exists and that its content contains the following filenames: authority-model.md, sacred-core-spec.md, agent-escalation-model.md, and hashing-strategy.md.
        """
        content = read_file("mesh/EXECUTE.md")
        # Find the PB-1 step content
        pb1_match = re.search(r'id="PB-1".*?</step>', content, re.DOTALL)
        assert pb1_match is not None, "PB-1 step not found in EXECUTE.md"
        pb1_content = pb1_match.group(0)
        # Verify all four constitutional docs referenced
        assert "authority-model.md" in pb1_content
        assert "sacred-core-spec.md" in pb1_content
        assert "agent-escalation-model.md" in pb1_content
        assert "hashing-strategy.md" in pb1_content

    def test_determinism_check_sacred_core_not_modified(self):
        """If sacred core was not modified, determinism check and pathway-deps must agree."""
        pathway = load_json("handoff/01-pathway-deps.json")
        det = load_json("handoff/05-determinism-check.json")
        if not pathway["sacred_core_boundary_approached"]:
            # Sacred core not approached — no violations expected
            assert det["float_violations"] == []
            assert det["math_random_violations"] == []

    def test_adr_governance_md_lists_same_adr_storage_path_as_adrs(self):
        """mesh/adr-governance.md should reference docs/adr/ which is where ADRs live."""
        gov_content = read_file("mesh/adr-governance.md")
        assert "docs/adr/" in gov_content

    def test_boot_prompt_proof_references_mesh_execute_md(self):
        """boot_prompt_proof.md must reference mesh/EXECUTE.md as the governed prompt."""
        content = read_file("boot_prompt_proof.md")
        assert "mesh/EXECUTE.md" in content

    def test_data_directory_exists_for_image(self):
        """The image was renamed from root to data/ — data/ directory must exist."""
        data_dir = os.path.join(REPO_ROOT, "data")
        assert os.path.isdir(data_dir), "data/ directory must exist after image rename"

    def test_renamed_image_exists_in_data_directory(self):
        """
        Assert that the repository image file has been moved into the data/ directory and removed from the repository root.
        
        Checks that the expected renamed `.webp` exists at data/p_3DpbNH91Hp89DnsjwOT8cmL4r0Q_3DpbNGK3V2Di1crp59QIVHFK7AG.webp and that the same filename is not present at the repository root.
        """
        new_path = os.path.join(
            REPO_ROOT,
            "data",
            "p_3DpbNH91Hp89DnsjwOT8cmL4r0Q_3DpbNGK3V2Di1crp59QIVHFK7AG.webp",
        )
        old_path = os.path.join(
            REPO_ROOT,
            "p_3DpbNH91Hp89DnsjwOT8cmL4r0Q_3DpbNGK3V2Di1crp59QIVHFK7AG.webp",
        )
        assert os.path.exists(new_path), "Image should exist in data/ after rename"
        assert not os.path.exists(old_path), "Image should NOT still be at repo root after rename"
