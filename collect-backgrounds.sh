#!/usr/bin/env bash
set -e
GNOME_BG_DIR="gnome-backgrounds"
RESULTS_DIR="./results"
IMAGES_DIR="$RESULTS_DIR/images"
RESULTS_JSON="$RESULTS_DIR/results.json"
COMMITS_JSON="$RESULTS_DIR/commits.json"
rm -rf "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR"
mkdir -p "$IMAGES_DIR"

if [ ! -d "$GNOME_BG_DIR" ]; then
    echo Gnome backgroudns repo is missing. Clone it from https://gitlab.gnome.org/GNOME/gnome-backgrounds
    exit 1
fi

PREVIOUS_COMMIT=`cat gnome-backgrounds.rev`
git -C $GNOME_BG_DIR checkout $PREVIOUS_COMMIT
find gnome-backgrounds | sed "s/^gnome-backgrounds\\///g" | grep -P '((\.jpg)|(\.jpeg)|(\.tif)|(\.tiff)|(\.svg)|(\.jxl)|(\.gif)|(\.webp)|(\.webp)|(\.png))$' | xargs -n1 git -C $GNOME_BG_DIR rm
git -C $GNOME_BG_DIR -c user.email=email@address.com -c user.name='Author Name' commit --author="Author Name <email@address.com>" -m "Currently in gnome-backgrounds"

echo -ne "[" > "$COMMITS_JSON"
git -C $GNOME_BG_DIR log --all --no-decorate --date-order --format=format:'{>><<hash>><<: >><<%H>><<, >><<date>><<: %at, >><<subject>><<: >><<%s>><<},' --reverse | tr -d '\n' | sed  's/\(.*\),/\1 /' | sed 's/"/\\\"/g' | sed 's/>><</"/g' >> "$COMMITS_JSON"
echo "]" >> "$COMMITS_JSON"
jq . "$COMMITS_JSON" | sponge "$COMMITS_JSON"

# type Change = {
#     commit: string,
#     date: number,
#     previousFileHash?: string,
#     newFileHash?: string,
#     file?: string,
#     originalRepoPath: string,
#     name: string,
#     message: string,
#     type: "add" | "remove" | "edit"
# }
echo -n "[" > "$RESULTS_JSON"

OIFS="$IFS"
IFS=$'\n'
for commit in `jq  -c '.[]' "$COMMITS_JSON"`; do
    hash=`echo $commit | jq -rc '.hash'`
    date=`echo $commit | jq -rc '.date'`
    subject=`echo $commit | jq -c '.subject'`

    echo "Processing $hash ($date) - $subject"
    git -C $GNOME_BG_DIR checkout $hash

    XML_FILES=$( find $GNOME_BG_DIR -iname '*.xml.i*' )

    for diff_tree_entry in `git  -C $GNOME_BG_DIR diff-tree --no-commit-id $hash -r --root | grep -P '((\.jpg)|(\.jpeg)|(\.tif)|(\.tiff)|(\.svg)|(\.jxl)|(\.gif)|(\.webp)|(\.webp)|(\.png))$'`; do
        creation=`echo $diff_tree_entry | grep -Po '^:000000' || true`
        deletion=`echo $diff_tree_entry | grep -Po '^:...... 000000' | grep -Po '000000$' || true`
        before_hash=`echo $diff_tree_entry | grep -Po '^:...... ...... [^\s]+' | grep -Po '[^\s]+$'`
        after_hash=`echo $diff_tree_entry | grep -Po '^:...... ...... [^\s]+ [^\s]+' | grep -Po '[^\s]+$'`
        hashes_json=''
        if [ -n "`echo $before_hash | grep -P '[^0\s]'`" ]; then
            hashes_json="\"previousFileHash\": \"$before_hash\","
        fi
        if [ -n "`echo $after_hash | grep -P '[^0\s]'`" ]; then
            hashes_json="$hashes_json \"newFileHash\": \"$after_hash\","
        fi
        file=`echo $diff_tree_entry | grep -Po '[^\s]+$'`
        filepath=$GNOME_BG_DIR/$file
        filename=${file##*/}
        filestem=${filename%.*}
        fileextension="${filename##*.}"
        echo "Processing $filename"

        LIGHT_JSON=./light.json
        DARK_JSON=./dark.json
        CONFIGS_JSON=./configs.json
        echo '[]' > $LIGHT_JSON
        echo '[]' > $DARK_JSON
        echo '[]' > $CONFIGS_JSON
        if [ -n "$XML_FILES" ] ; then
            xpath -n -e "/wallpapers/wallpaper/filename[substring(text(), string-length(text()) - string-length('$filename') + 1)  = '$filename']/.." ${XML_FILES[@]} | tr -d '\n'  | sed -r 's/<!--.*-->//g' | sed -r 's/<[^\/]*\/>//g' | sed -r 's/"/\\"/g' | sed 's/<wallpaper[^>]*>//g' | sed 's/<\/wallpaper>/\n/g' | sed -r 's/<([^\/> ]+)>/"\1": "/g' | sed -r 's/<\/[^>]+>/",/g' | sed -r 's/,\s*$/}/g' | sed -r 's/^\s*/{/g' | sed -r 's/\s+/ /g' | jq -sc '.' > $LIGHT_JSON
            xpath -n -e "/wallpapers/wallpaper/filename-dark[substring(text(), string-length(text()) - string-length('$filename') + 1)  = '$filename']/.." ${XML_FILES[@]} | tr -d '\n'  | sed -r 's/<!--.*-->//g' | sed -r 's/<[^\/]*\/>//g' | sed -r 's/"/\\"/g' | sed 's/<wallpaper[^>]*>//g' | sed 's/<\/wallpaper>/\n/g' | sed -r 's/<([^\/> ]+)>/"\1": "/g' | sed -r 's/<\/[^>]+>/",/g' | sed -r 's/,\s*$/}/g' | sed -r 's/^\s*/{/g' | sed -r 's/\s+/ /g' | jq -sc '.' > $DARK_JSON
            cat $LIGHT_JSON $DARK_JSON | jq -sc '. | flatten' > $CONFIGS_JSON 
        fi


        type="edit"
        if [ -n "$creation" ]; then
            type="add"
        fi
        if [ -n "$deletion" ]; then
            type="delete"
            echo "Deleted $filename ($FILE_HASH)"
            echo -n "{\"commit\": \"$hash\", \"date\": $date, $hashes_json \"originalRepoPath\": \"$file\",\"name\": \"$filestem\", \"message\": $subject, \"type\": \"$type\", \"configs\": "`cat $CONFIGS_JSON`"}," >> "$RESULTS_JSON"
        else
            FILE_HASH=$after_hash
            DESTINATION_FILE="$IMAGES_DIR/$filestem-$FILE_HASH.webp"
            ORIGINAL_FILE="$IMAGES_DIR/$filestem-$FILE_HASH-source.$fileextension"
            cp $filepath $ORIGINAL_FILE
            if [ -n "`echo $filepath | grep -P '\.webp$'`" ]; then
                cp $filepath $DESTINATION_FILE
            elif [ -n "`echo $filepath | grep -P '\.svg$'`" ]; then
                TEMPDIR=`mktemp -d`
                TEMPFILE="$TEMPDIR/$filestem.png"
                rsvg-convert -w 4096 $filepath -o $TEMPFILE
                convert $TEMPFILE -define webp:lossless=true $DESTINATION_FILE
                rm -rf $TEMPDIR
            elif [ -n "`echo $filepath | grep -P '\.jxl$'`" ]; then
                TEMPDIR=`mktemp -d`
                TEMPFILE="$TEMPDIR/$filestem.png"
                djxl $filepath -q 100 $TEMPFILE
                convert $TEMPFILE -quality 95 $DESTINATION_FILE
                rm -rf $TEMPDIR
            elif [ -n "`echo $filepath | grep -P '((\.tif)|(\.tiff)|(\.gif)|(\.png))$'`" ]; then
                convert $filepath -define webp:lossless=true $DESTINATION_FILE
            else
                convert $filepath -quality 95 $DESTINATION_FILE
            fi
            echo "Added or edited $filename ($FILE_HASH)"
            echo -n "{\"commit\": \"$hash\", \"date\": $date, $hashes_json \"file\": \"images/$FILE_HASH.webp\",\"originalRepoPath\": \"$file\",\"name\": \"$filestem\", \"message\": $subject, \"type\": \"$type\", \"configs\": "`cat $CONFIGS_JSON`"}," >> "$RESULTS_JSON"
        fi

    done
done

echo -n "]" >> "$RESULTS_JSON"

cat "$RESULTS_JSON" | tr -d '\n' | sed  's/\(.*\),/\1 /' | jq . | sponge "$RESULTS_JSON"

git -C $GNOME_BG_DIR checkout $PREVIOUS_COMMIT