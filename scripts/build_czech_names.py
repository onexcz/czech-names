"""Build the 'common Czech names' lists (public/data/czech/{boys,girls}.csv).

A name is included if it is in the Czech civil name-day calendar
(scripts/calendar.csv) or was ranked in the top 100 in any year file
under public/data/{boys,girls}/ (ČSÚ data). Run from the repo root:

    python3 scripts/build_czech_names.py
"""
import csv
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
TOP_N = 100
PLACEHOLDERS = {"NEZJIŠTĚNO"}


def first_rank(rank: str) -> int:
    return int(rank.split("-")[0])


def main() -> None:
    names = {"boys": set(), "girls": set()}
    sources = {"boys": {}, "girls": {}}

    for line in (ROOT / "scripts" / "calendar.csv").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        name, sex = line.split(",")
        key = "boys" if sex == "m" else "girls"
        names[key].add(name)

    for key in names:
        for f in sorted((DATA / key).glob("[0-9][0-9][0-9][0-9].csv")):
            for row in csv.reader(f.read_text(encoding="utf-8").splitlines()):
                if len(row) != 2 or not row[0].strip():
                    continue
                rank, name = row[0].strip(), row[1].strip().upper()
                if name in PLACEHOLDERS or first_rank(rank) > TOP_N:
                    continue
                # Older files list variants as "MICHALA (MICHAELA)"
                for part in re.split(r"\s*[()]\s*", name):
                    if part:
                        names[key].add(part)

        out = DATA / "czech" / f"{key}.csv"
        out.parent.mkdir(exist_ok=True)
        out.write_text("\n".join(sorted(names[key])), encoding="utf-8")
        print(f"{out.relative_to(ROOT)}: {len(names[key])} names")


if __name__ == "__main__":
    main()
