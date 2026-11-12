import { createListCompositions } from "./list-compositions.js"
import { createListCurrencies } from "./list-currencies.js"
import { createListDistributions } from "./list-distributions.js"
import { createListEngravers } from "./list-engravers.js"
import { createListIssuers } from "./list-issuers.js"
import { createListMints } from "./list-mints.js"
import { createListOrientations } from "./list-orientations.js"
import { createListRulingAuthorities } from "./list-ruling-authorities.js"
import { createListShapes } from "./list-shapes.js"
import { createListTags } from "./list-tags.js"
import { createListTechniques } from "./list-techniques.js"

import type { Database } from "../connection.js"

export function createReferenceDataQueries(orm: Database["orm"]) {
  return {
    listCompositions: createListCompositions(orm),
    listCurrencies: createListCurrencies(orm),
    listDistributions: createListDistributions(orm),
    listEngravers: createListEngravers(orm),
    listIssuers: createListIssuers(orm),
    listMints: createListMints(orm),
    listOrientations: createListOrientations(orm),
    listRulingAuthorities: createListRulingAuthorities(orm),
    listShapes: createListShapes(orm),
    listTags: createListTags(orm),
    listTechniques: createListTechniques(orm),
  }
}
