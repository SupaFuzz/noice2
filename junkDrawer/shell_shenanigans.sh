## for reference
## https://docs.postgrest.org/en/v12/references/api/tables_views.html#get-and-head

## [DONE] login, get a token and export it to $TOKEN
curl "http://localhost:3000/rpc/login" -X POST -H "Content-Type: application/json" -d '{ "email": "amy@hicox.com", "pass": "s053kr3t!" }'

## [DONE] create a row
curl "http://localhost:3000/nthree_albums" -X POST \
-H "Content-Type: application/json" \
-H "Content-Profile: mezo" \
-H "Authorization: Bearer $TOKEN" \
-d '{"album_name":"Let it Be","artist":"The Beatles","label":"Apple","submitter":"2","last_modified_by":"2"}';

## [DONE] read a specific row
curl "http://localhost:3000/nthree_albums?id=eq.1" -H "Content-Type: application/json" -H "Content-Profile: mezo" -H "Authorization: Bearer $TOKEN"


## [DONE] modify a row
curl "http://localhost:3000/nthree_albums?id=eq.1" -X PATCH \
-H "Content-Type: application/json" \
-H "Content-Profile: mezo" \
-H "Authorization: Bearer $TOKEN" \
-d '{ "label": "RCA" }'

## [DONE] delete a row
curl "http://localhost:3000/nthree_albums?id=eq.1" -X DELETE \
-H "Content-Type: application/json" \
-H "Content-Profile: mezo" \
-H "Authorization: Bearer $TOKEN"

## [DONE] upsert -- like a merge I guess?
curl "http://localhost:3000/nthree_albums" -X POST \
-H "Content-Type: application/json" \
-H "Content-Profile: mezo" \
-H "Prefer: resolution=merge-duplicates" \
-H "Prefer: return=headers-only" \
-H "Authorization: Bearer $TOKEN" \
-d '[{"album_name":"Let it Be","artist":"The Beatles","label":"Apple"}, {"album_name":"Licensed to Ill","artist":"Beastie Boys","label":"Columbia"}]'

## get all rows modified since a given date
curl "http://localhost:3000/nthree_albums?modified_date=gt.2025-01-01T00:00:00.000000" \
-H "Content-Type: application/json" \
-H "Content-Profile: mezo" \
-H "Authorization: Bearer $TOKEN"


## list all in form
curl "http://localhost:3000/nthree_albums" -H "Content-Type: application/json" -H "Content-Profile: mezo" -H "Authorization: Bearer $TOKEN"
