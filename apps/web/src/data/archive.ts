import { createSerializationAdapter } from "@tanstack/react-router"

import {
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidEngraverSlugError,
  InvalidIssuerCodeError,
} from "./archive/coins"
import {
  EngraverListRequestError,
  InvalidEngraverListResponseError,
} from "./archive/engravers"
import {
  InvalidIssuerListResponseError,
  IssuerListRequestError,
} from "./archive/issuers"

export {
  coinDetailQueryOptions,
  coinListQueryOptions,
  CoinNotFoundError,
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidEngraverSlugError,
  InvalidIssuerCodeError,
  validateCoinId,
} from "./archive/coins"
export type { CoinListFilters } from "./archive/coins"
export {
  engraverListQueryOptions,
  EngraverListRequestError,
  InvalidEngraverListResponseError,
} from "./archive/engravers"
export {
  InvalidIssuerListResponseError,
  issuerListQueryOptions,
  IssuerListRequestError,
} from "./archive/issuers"

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
    "InvalidEngraverListResponseError",
    InvalidEngraverListResponseError
  ),
  errorAdapter("EngraverListRequestError", EngraverListRequestError),
  errorAdapter(
    "InvalidIssuerListResponseError",
    InvalidIssuerListResponseError
  ),
  errorAdapter("IssuerListRequestError", IssuerListRequestError),
  errorAdapter("InvalidIssuerCodeError", InvalidIssuerCodeError),
  errorAdapter("InvalidEngraverSlugError", InvalidEngraverSlugError),
]
