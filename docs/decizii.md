# Decizii

## MVP public read-only
- Vizualizare publica fara cont.
- Fara comentarii publice (evitam toxicitate + moderare grea).
- Cont necesar doar pentru raportare.

## Cont pentru raportare
- Autentificare simpla la inceput (email/parola).
- Roluri minime: user, admin.

## Date si stocare
- PostgreSQL pentru date relationale (rapoarte, status, categorii).
- Pozele se tin in storage extern; in DB pastram doar URL-uri si metadata.

## UI
- Mobil: harta + lista, filtre pe oras/categorie/status.
- Admin web: triere rapoarte + schimbare status.
