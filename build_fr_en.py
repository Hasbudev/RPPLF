import json, re
import requests
from bs4 import BeautifulSoup

URL = "https://bulbapedia.bulbagarden.net/wiki/List_of_French_Pok%C3%A9mon_names"

def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()

html = requests.get(URL, timeout=30).text
soup = BeautifulSoup(html, "html.parser")

# La table principale a des lignes #0001 ... et colonnes English / French
rows = soup.select("table.roundy tr")
pairs = []

for tr in rows:
    tds = tr.find_all(["td", "th"])
    if len(tds) < 4:
        continue

    ndex = clean(tds[0].get_text())
    if not ndex.startswith("#"):
        continue

    # ndex looks like "#0001"
    num = int(ndex.replace("#", ""))
    if num < 1 or num > 807:
        continue

    en = clean(tds[2].get_text())
    fr = clean(tds[3].get_text())
    pairs.append({"fr": fr, "en": en})

# Sauvegarde
with open("dex-gen1-7-fr-en.json", "w", encoding="utf-8") as f:
    json.dump(pairs, f, ensure_ascii=False, indent=2)

print("OK -> dex-gen1-7-fr-en.json:", len(pairs), "entrées")
