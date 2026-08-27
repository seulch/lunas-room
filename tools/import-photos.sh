#!/usr/bin/env bash
# Bring photos into the site: resize, compress, drop them in the right folder,
# and update content.js. Existing captions are kept.
#
#   bash tools/import-photos.sh gallery ~/Desktop/our-photos
#   bash tools/import-photos.sh avatar  ~/Desktop/luna-yelling.jpg
#   bash tools/import-photos.sh gift    ~/Desktop/the-bag.jpg
#
# HEIC straight off an iPhone is fine — sips converts it.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-}"
SRC="${2:-}"

usage() { sed -n '2,9p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 1; }
[ -n "$MODE" ] && [ -n "$SRC" ] || usage

shrink() { # $1 src  $2 dest  $3 max edge
  sips -Z "$3" -s format jpeg -s formatOptions 72 "$1" --out "$2" >/dev/null 2>&1
}

case "$MODE" in
  avatar)
    [ -f "$SRC" ] || { echo "not a file: $SRC"; exit 1; }
    mkdir -p "$HERE/images/luna"
    shrink "$SRC" "$HERE/images/luna/avatar.jpg" 400
    echo "→ images/luna/avatar.jpg  ($(( $(stat -f%z "$HERE/images/luna/avatar.jpg") / 1024 )) KB)"
    ;;

  gift)
    [ -f "$SRC" ] || { echo "not a file: $SRC"; exit 1; }
    mkdir -p "$HERE/images/gift"
    shrink "$SRC" "$HERE/images/gift/01.jpg" 1400
    echo "→ images/gift/01.jpg  ($(( $(stat -f%z "$HERE/images/gift/01.jpg") / 1024 )) KB)"
    ;;

  gallery)
    [ -d "$SRC" ] || { echo "not a folder: $SRC"; exit 1; }
    DIR="images/gallery"; MAX=1600
    mkdir -p "$HERE/$DIR"

    # sorted so 01, 02, 03... land in the order you named them
    FILES=()
    while IFS= read -r f; do FILES+=("$f"); done < <(
      find "$SRC" -maxdepth 1 -type f \
        \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.webp' \) \
        ! -name '.*' | sort)
    [ "${#FILES[@]}" -gt 0 ] || { echo "no images found in $SRC"; exit 1; }

    rm -f "$HERE/$DIR"/[0-9][0-9].jpg
    i=0
    for f in "${FILES[@]}"; do
      i=$((i + 1))
      out=$(printf "%s/%02d.jpg" "$HERE/$DIR" "$i")
      shrink "$f" "$out" "$MAX"
      printf "  %02d  %-42s %5s KB\n" "$i" "$(basename "$f")" "$(( $(stat -f%z "$out") / 1024 ))"
    done
    echo "→ $i photo(s) into $DIR"

    COUNT="$i" python3 - "$HERE" <<'PY'
import os, re, sys
here, count = sys.argv[1], int(os.environ['COUNT'])
path = os.path.join(here, 'content', 'content.js')
src = open(path).read()

block = re.search(r'(  gallery: \[\n)(.*?)(\n  \],\n)', src, re.S)
caps = re.findall(r'caption:\s*"((?:[^"\\]|\\.)*)"', block.group(2))
rows = '\n'.join(
    '    { img: "images/gallery/%02d.jpg", caption: "%s" },'
    % (n + 1, caps[n] if n < len(caps) else '')
    for n in range(count))
src = src[:block.start(2)] + rows + src[block.end(2):]

open(path, 'w').write(src)
print("→ content.js updated (%d entries, captions kept)" % count)
PY
    ;;

  *) usage ;;
esac
