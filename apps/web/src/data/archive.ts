import { createSerializationAdapter } from "@tanstack/react-router"

import {
  InvalidCoinIdError,
  InvalidCoinResponseError,
} from "./archive/coin-detail"
import { InvalidCoinListResponseError } from "./archive/coins"
import {
  InvalidIssuerListResponseError,
  IssuerListRequestError,
} from "./archive/issuers"

export {
  coinListQueryOptions,
  InvalidCoinListResponseError,
} from "./archive/coins"
export type { CoinListFilters } from "./archive/coins"
export {
  coinDetailQueryOptions,
  CoinNotFoundError,
  InvalidCoinIdError,
  InvalidCoinResponseError,
  validateCoinId,
} from "./archive/coin-detail"
export { tagListQueryOptions } from "./archive/tags"
export { mintListQueryOptions } from "./archive/mints"
export { currencyListQueryOptions } from "./archive/currencies"
export { distributionListQueryOptions } from "./archive/distributions"
export { techniqueListQueryOptions } from "./archive/techniques"
export { compositionListQueryOptions } from "./archive/compositions"
export { shapeListQueryOptions } from "./archive/shapes"
export { orientationListQueryOptions } from "./archive/orientations"
export { engraverListQueryOptions } from "./archive/engravers"
export {
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
} from "./archive/issuers"
export { rulingAuthorityListQueryOptions } from "./archive/rulers"

function errorAdapter(key: string, ErrorType: new (message: string) => Error) {
  return createSerializationAdapter({
    key,
    test: (value): value is Error => value instanceof ErrorType,
    // Preserve the UI error type without sending causes or stacks to the browser.
    toSerializable: (error) => error.message,
    fromSerializable: (message) => new ErrorType(message),
  })
}

export const archiveErrorSerializationAdapters = [
  errorAdapter("InvalidCoinIdError", InvalidCoinIdError),
  errorAdapter("InvalidCoinResponseError", InvalidCoinResponseError),
  errorAdapter("InvalidCoinListResponseError", InvalidCoinListResponseError),
  errorAdapter(
    "InvalidIssuerListResponseError",
    InvalidIssuerListResponseError
  ),
  errorAdapter("IssuerListRequestError", IssuerListRequestError),
]
