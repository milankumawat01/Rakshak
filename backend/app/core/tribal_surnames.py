"""Tribal surname database for CNT Act auto-detection.

Maintains a set of known Jharkhand tribal (Scheduled Tribe) surnames
from CNT Act and SPT Act schedules. Used to infer tribal status when
OCR cannot extract the 'T'/'H' marker from the document.
"""

# Comprehensive set of Jharkhand ST community surnames.
# Sources: CNT Act schedules, Jharkhand tribal welfare department lists.
# Includes common English transliterations of Hindi/tribal names.
TRIBAL_SURNAMES: set[str] = {
    # Munda community
    "munda", "mundu",
    # Oraon / Uraon community
    "oraon", "uraon",
    # Santhal community
    "soren", "hembrom", "marandi", "kisku", "hansda", "murmu",
    "tudu", "besra", "baski", "baskey", "hasdak", "marndi",
    "hansdak", "santal", "santhal",
    # Ho community
    "ho", "sinku", "samad", "deogharia", "hasda",
    # Kharia community
    "kharia", "khariya",
    # Birhor community
    "birhor",
    # Korwa community
    "korwa",
    # Asur community
    "asur",
    # Bhumij community
    "bhumij",
    # Chero community
    "chero", "cheros",
    # Gond community
    "gond", "gondi",
    # Kharwar community
    "kharwar",
    # Lohra community
    "lohra", "lohar",
    # Mahli community
    "mahli",
    # Paharia community
    "paharia", "pahariya", "sauria", "mal-paharia", "malpaharia",
    # Savar / Sabar community
    "savar", "sabar",
    # Birjia community
    "birjia",
    # Bedia community
    "bedia",
    # Christian tribal surnames (common among Oraon/Munda converts)
    "tirkey", "toppo", "ekka", "kerketta", "minj", "dungdung",
    "barla", "kujur", "lakra", "beck", "xalxo", "khalko",
    "tigga", "kindo", "kandulna", "surin", "linda", "nag",
    "barwa", "horo", "kispotta", "bilung", "tete", "baxla",
    "panna", "soreng", "prabha", "kongari",
    # Mahto variants (tribal context — Paharia/Kumarbhag)
    "mahto", "mahato",
    # Oraon sub-groups
    "bhagat", "tana",
    # Khond community
    "khond", "kondh",
    # Binjhia community
    "binjhia",
    # Kol community
    "kol",
    # Korba community
    "korba",
    # Parhaiya community
    "parhaiya",
    # Chik-Baraik community
    "baraik",
    # Gorait community
    "gorait",
    # Kisan community
    "kisan",
    # Nagesia community
    "nagesia", "nagbanshi",
    # Additional common tribal surnames
    "pahan", "hembram", "tutiyal", "kishore",
    "gagrai", "jamuda", "purti", "bodra", "sulem",
    "singh munda", "hansda munda",
    "manjhi", "jojo", "samad",
}

# Hindi transliterations (Devanagari → Latin mapping of common surnames)
_HINDI_TRANSLITERATIONS: dict[str, str] = {
    "मुंडा": "munda",
    "उरांव": "oraon",
    "सोरेन": "soren",
    "हेम्ब्रम": "hembrom",
    "मरांडी": "marandi",
    "किस्कू": "kisku",
    "हांसदा": "hansda",
    "मुर्मू": "murmu",
    "तुडू": "tudu",
    "बेसरा": "besra",
    "तिर्की": "tirkey",
    "टोप्पो": "toppo",
    "एक्का": "ekka",
    "लकड़ा": "lakra",
    "कुजूर": "kujur",
    "महतो": "mahto",
    "मांझी": "manjhi",
    "पाहन": "pahan",
}


def is_tribal_surname(surname: str) -> bool:
    """Check if a surname belongs to a CNT-protected tribal community."""
    if not surname:
        return False
    clean = surname.strip().lower()

    # Direct match
    if clean in TRIBAL_SURNAMES:
        return True

    # Hindi transliteration match
    if clean in _HINDI_TRANSLITERATIONS:
        return True

    return False


def detect_tribal_from_name(full_name: str) -> tuple[bool, float]:
    """Infer tribal status from a full name by checking each token against
    the tribal surname database.

    Returns:
        (is_tribal, confidence) where confidence is 0.0-1.0.
        - Exact surname match → (True, 0.90)
        - Hindi transliteration match → (True, 0.85)
        - No match → (False, 0.50)  — low confidence because absence
          of a known surname doesn't confirm non-tribal status.
    """
    if not full_name:
        return False, 0.0

    tokens = full_name.strip().lower().split()

    for token in tokens:
        if token in TRIBAL_SURNAMES:
            return True, 0.90
        if token in _HINDI_TRANSLITERATIONS:
            return True, 0.85

    return False, 0.50
