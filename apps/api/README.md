# Coin Archive API

The standalone API serves the public Coin Archive catalogue over HTTP. Its generated OpenAPI 3.1 contract is available at `GET /openapi.json`; use that contract for the exact request and response schemas. This guide covers common requests and behavior that callers need when using the API.

## Quick start

Follow the [repository setup](../../README.md#getting-started) to install dependencies and start the local database. From the repository root, run:

```bash
pnpm --filter api dev
```

The local base URL is `http://localhost:3001` unless `API_PORT` is changed.
The current catalogue routes are read-only and require no authentication.

```bash
curl 'http://localhost:3001/v1/coins?page=1&pageSize=24'
```

The response has a `coins` array and pagination metadata. For an empty catalogue, it looks like this:

```json
{
  "coins": [],
  "pagination": {
    "page": 1,
    "pageSize": 24,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

To inspect the full schema, fetch `http://localhost:3001/openapi.json`.

## Catalogue routes

| Route                    | Returns                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `GET /v1/coins`          | A page of Coins with summary fields, Face Value, and Obverse and Reverse image URLs           |
| `GET /v1/coins/{coinId}` | One Coin by UUID, including its surfaces, Engraver credits, and Ruling Authority attributions |
| `GET /v1/coins/by-slug/{coinSlug}` | The same Coin detail by its globally unique Slug |
| `GET /v1/currencies`     | Currencies and their public slugs                                                             |
| `GET /v1/distributions`  | Coin Distributions and their public slugs                                                     |
| `GET /v1/engravers`      | Engravers and their public slugs                                                              |
| `GET /v1/issuers`        | Issuers and their public codes                                                                |
| `GET /v1/mints`          | Mints and their stable public slugs                                                           |
| `GET /v1/rulers`         | Ruling Authorities and their public slugs                                                     |
| `GET /v1/tags`           | Tags and their public slugs                                                                   |
| `GET /v1/techniques`     | Coin Techniques and their stable public slugs                                                 |

Coin detail includes required nullable numeric `size` and `thickness` in millimetres and `weight` in grams. `null` means that measurement is unknown; each is independent. It also includes `tags`, an array of `{ "slug": "map", "name": "Map" }` entries, or `[]` for an untagged Coin. Coin list items omit these fields and Tags.

Coin detail also includes nullable `technique` and `techniqueName` fields. `technique` is the stable public slug; `techniqueName` is the current display name. Both are `null` when unknown. Milled means machine struck, independently of edge treatment. Coin list items omit both fields. `GET /v1/techniques` returns `{ "techniques": [{ "slug": "milled", "name": "Milled" }] }`, ordered by name then slug, or `{ "techniques": [] }` when the catalogue is empty.

## Find Coins

`GET /v1/coins` accepts one exact value for each optional filter:

| Parameter      | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| `amount`       | Exact positive Face Value Amount; requires `currency`                                   |
| `currency`     | Case-sensitive Currency Slug                                                            |
| `distribution` | Case-sensitive Coin Distribution Slug; use a value returned by `GET /v1/distributions`  |
| `technique`    | Exact, case-sensitive Coin Technique slug; use a value returned by `GET /v1/techniques` |
| `tag`          | Exact, case-sensitive Tag Slug; use a value returned by `GET /v1/tags`                  |
| `issuer`       | Case-sensitive Issuer Code, such as `AR`                                                |
| `mint`         | Exact, case-sensitive Mint Slug; use a value returned by `GET /v1/mints`                |
| `engraver`     | Case-sensitive Engraver Slug                                                            |
| `ruler`        | Case-sensitive Ruling Authority Slug                                                    |
| `year`         | One Issue Year or a closed Issue Year range                                             |
| `size`         | Exact Coin Size or an inclusive closed range in millimetres                             |
| `thickness`    | Exact Coin Thickness or an inclusive closed range in millimetres                        |
| `weight`       | Exact Coin Weight or an inclusive closed range in grams                                 |

Filters can be combined. For example:

```bash
curl 'http://localhost:3001/v1/coins?issuer=AR&distribution=standard-circulation&year=1992-1994'
curl 'http://localhost:3001/v1/coins?currency=argentine-peso-convertible&amount=0.5'
curl 'http://localhost:3001/v1/coins?mint=rome-state-mint-italy&issuer=IT&page=1'
curl 'http://localhost:3001/v1/coins?size=20-25.75&weight=8.125'
curl 'http://localhost:3001/v1/coins?thickness=1.5-2.25&issuer=AR'
curl 'http://localhost:3001/v1/coins?tag=map&issuer=FI&page=1'
```

The Currency Slug in the second example is illustrative; use a value returned
by `GET /v1/currencies` for your catalogue. `amount` uses a canonical decimal
string with up to 18 integer and 12 fractional digits. For example, `0.5` is
valid, while `0.50`, `0`, and scientific notation are invalid. A valid filter
that matches no Coins returns `200` with an empty `coins` array.
The `mint` filter matches only Coins associated with that physical Mint and
combines with other filters and pagination. A valid unknown slug returns an
empty successful page; malformed or repeated values return `400` with
`invalid_mint_slug`.

The `tag` filter matches exact Tag Slugs before counting and paging, and combines with other filters without duplicating Coins. Repeat `tag` to require all selected Tags; add `tagMatch=any` to match any selected Tag. A valid unknown Slug can be combined with a known one in any mode. An unknown Slug alone returns an empty successful page. Malformed or duplicate Tags, invalid or repeated `tagMatch`, and `tagMatch` without `tag` return `400` with `invalid_tag`.

`GET /v1/tags` returns `{"tags":[{"slug":"map","name":"Map"}]}` for the current seed catalogue, ordered by name then slug. It has no defined query parameters; an empty catalogue returns `{"tags":[]}`.

Size, Thickness, and Weight each accept one positive decimal for an exact match,
or two positive decimals separated by a hyphen for an inclusive range. Size and
Thickness allow at most two fractional digits; Weight allows three. A reversed
or open-ended range, a repeated filter, or a malformed or overly precise value
returns `400` with
`invalid_measurement_filter`. Filters compare stored values exactly, combine
with the other filters before pagination and total counting, and exclude Coins
whose selected measurement is unknown. Coins with unknown measurements remain
in results when that measurement has no filter.

Issue Years use signed conventional BCE/CE numbering: `-44` means 44 BCE,
`2026` means 2026 CE, and year zero is invalid. A single year matches a Coin
whose Issue Period contains that year. A range such as `-25-19` includes both
boundaries and matches a Coin whose Issue Period overlaps it. Ranges must have
two ordered, nonzero endpoints. See [ADR 0003](../../docs/adr/0003-represent-issue-years-without-year-zero.md)
for the calendar convention.

## List Currencies

`GET /v1/currencies` returns each Currency's public `slug`, `name`, and `fullName`. It has no defined query parameters.

```bash
curl 'http://localhost:3001/v1/currencies'
```

For a catalogue containing the Argentine convertible peso, the response is:

```json
{
  "currencies": [
    {
      "slug": "argentine-peso-convertible",
      "name": "Peso",
      "fullName": "Peso (1992–2001)"
    }
  ]
}
```

`fullName` combines the Currency Name and its period label.
An empty catalogue returns `{"currencies":[]}`.
Use a returned `slug` as the `currency` filter on `GET /v1/coins`.

## List Mints

`GET /v1/mints` returns public Mint records ordered by name and then slug. The
slug is globally unique and stable independently of the Mint's display name.
It has no defined query parameters.

```bash
curl 'http://localhost:3001/v1/mints'
```

```json
{
  "mints": [
    {
      "slug": "rome-state-mint-italy",
      "name": "Zecca dello Stato",
      "place": "Rome",
      "country": { "code": "IT", "name": "Italy" }
    }
  ]
}
```

An empty catalogue returns `{"mints":[]}`. A Coin may have multiple confirmed
Mints or none.

## List Coin Distributions

`GET /v1/distributions` returns every Coin Distribution's public `slug` and `name`, ordered by name and then slug. It has no defined query parameters.

```bash
curl 'http://localhost:3001/v1/distributions'
```

For a catalogue containing Standard circulation, the response is:

```json
{
  "distributions": [
    {
      "slug": "standard-circulation",
      "name": "Standard circulation"
    }
  ]
}
```

An empty catalogue returns `{"distributions":[]}`.
Use a returned `slug` as the `distribution` filter on `GET /v1/coins`.

## List Engravers

`GET /v1/engravers` returns each Engraver's public `slug` and `fullName`. It has no defined query parameters.

```bash
curl 'http://localhost:3001/v1/engravers'
```

For a catalogue containing one Engraver, the response is:

```json
{
  "engravers": [
    {
      "slug": "first-engraver",
      "fullName": "First Engraver"
    }
  ]
}
```

An empty catalogue returns `{"engravers":[]}`.
Use a returned `slug` as the `engraver` filter on `GET /v1/coins`.

## List Issuers

`GET /v1/issuers` returns each Issuer's public `name` and `code`. It has no defined query parameters.

```bash
curl 'http://localhost:3001/v1/issuers'
```

For a catalogue containing Argentina and the Roman Empire, the response is:

```json
{
  "issuers": [
    { "name": "Argentina", "code": "AR" },
    { "name": "Roman Empire", "code": "ROMAN" }
  ]
}
```

An empty catalogue returns `{"issuers":[]}`.
Use a returned `code` as the `issuer` filter on `GET /v1/coins`.

## List Ruling Authorities

`GET /v1/rulers` returns each Ruling Authority's public `slug`, `name`, `role`, and optional `tenure`. It has no defined query parameters.

```bash
curl 'http://localhost:3001/v1/rulers'
```

For a catalogue containing one Ruling Authority, the response is:

```json
{
  "rulers": [
    {
      "slug": "first-name",
      "name": "First Name",
      "role": "King",
      "tenure": null
    }
  ]
}
```

An empty catalogue returns `{"rulers":[]}`.
Use a returned `slug` as the `ruler` filter on `GET /v1/coins`.

### Pagination

`page` starts at 1 and defaults to 1. `pageSize` defaults to 24 and may be from 1 to 100. The response includes exact `totalItems` and `totalPages`; a page past the end returns `200` with an empty `coins` array. Results are ordered by creation time descending, then Coin ID ascending. Pages reflect the live catalogue, so concurrent changes can shift Coins between requests. See [ADR 0004](../../docs/adr/0004-use-live-numbered-pagination-for-the-coin-list.md) for the pagination contract.

## Errors and request IDs

Errors use a JSON `error` object with a stable `code` and a `message`. For example, a malformed `pageSize` returns HTTP `400`:

```json
{
  "error": {
    "code": "invalid_pagination",
    "message": "Pagination is invalid"
  }
}
```

Malformed Coin filters also return `400` with a corresponding code, such as `invalid_year` or `invalid_face_value_filter`. `GET /v1/coins/{coinId}` returns `400` with `invalid_coin_id` for a malformed UUID and `404` with `coin_not_found` for a valid UUID absent from the catalogue. `GET /v1/coins/by-slug/{coinSlug}` returns the same detail, `400` with `invalid_coin_slug` for a malformed Slug, or `404` with `coin_not_found` for an unknown Slug. An unknown route returns `404` with `not_found`. An unexpected server failure returns `500` with `internal_error`. Consult `/openapi.json` for each route's documented responses.

Every response includes `x-request-id`. You may send that header with a request to carry your own correlation ID; the API accepts 1–128 ASCII letters, digits, periods, underscores, colons, or hyphens. Otherwise it generates an ID. Include the returned ID when reporting a failed request. Catalogue and operational responses use `Cache-Control: no-store`.

## Health and browser access

`GET /health` returns `{"status":"ok"}` when the API process is serving HTTP.
`GET /ready` also checks database readiness; it returns the same `200` response when ready or `503` with `{"status":"unavailable"}` when database-backed work is unavailable. These endpoints do not require authentication.

Browser access is limited to origins configured in `API_ALLOWED_ORIGINS`.
Requests do not use credentialed CORS. See [the API environment example](.env.example) for local configuration.
