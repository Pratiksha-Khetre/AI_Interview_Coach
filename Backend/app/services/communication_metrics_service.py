# Backend/app/services/communication_metrics_service.py

"""
Lightweight, dependency-free helpers for computing basic
speech/communication metrics from a submitted interview answer:

    - word count
    - words per minute (WPM)
    - filler word detection + count

This is intentionally separate from answer_evaluation_service,
which handles the AI-based answer-quality evaluation (correctness,
clarity, completeness, relevance). Nothing here calls an LLM and
nothing here affects that evaluation.
"""

import re
from collections import Counter


# ============================================================
# FILLER WORDS / PHRASES
# ============================================================
#
# Multi-word phrases are checked first (and independently of the
# single-word list) so a phrase like "you know" is counted once as
# a phrase rather than contributing to unrelated single-word counts.

FILLER_PHRASES = [
    "you know",
    "i mean",
    "sort of",
    "kind of",
]

FILLER_WORDS = [
    "um",
    "uh",
    "hmm",
    "like",
    "actually",
    "basically",
    "literally",
]


# ============================================================
# WORD COUNT
# ============================================================

def count_words(text: str) -> int:

    if not text or not text.strip():
        return 0

    words = re.findall(r"[A-Za-z0-9']+", text)

    return len(words)


# ============================================================
# WORDS PER MINUTE
# ============================================================

def calculate_wpm(
    word_count: int,
    duration_seconds: int,
) -> float:

    # Guard against division-by-zero / nonsensical input:
    # zero duration, zero words, or negative values all return 0.
    if word_count <= 0 or duration_seconds <= 0:
        return 0.0

    minutes = duration_seconds / 60

    return round(word_count / minutes, 1)


# ============================================================
# FILLER WORD DETECTION
# ============================================================

def detect_filler_words(text: str) -> dict[str, int]:
    """
    Counts filler words/phrases using whole-word / whole-phrase
    matching (word boundaries), so e.g. "like" never matches inside
    "likely" or "unlike".
    """

    if not text or not text.strip():
        return {}

    working_text = text.lower()

    counts: "Counter[str]" = Counter()

    for phrase in FILLER_PHRASES:

        pattern = r"\b" + re.escape(phrase) + r"\b"
        matches = re.findall(pattern, working_text)

        if matches:
            counts[phrase] = len(matches)

    for word in FILLER_WORDS:

        pattern = r"\b" + re.escape(word) + r"\b"
        matches = re.findall(pattern, working_text)

        if matches:
            counts[word] = len(matches)

    return dict(counts)


# ============================================================
# COMPUTE ALL METRICS FOR ONE ANSWER
# ============================================================

def compute_answer_metrics(
    answer: str,
    duration_seconds: int,
) -> dict:

    word_count = count_words(answer)

    wpm = calculate_wpm(
        word_count,
        duration_seconds,
    )

    filler_words = detect_filler_words(answer)

    filler_word_count = sum(filler_words.values())

    return {
        "word_count": word_count,
        "wpm": wpm,
        "filler_word_count": filler_word_count,
        "filler_words": filler_words,
    }