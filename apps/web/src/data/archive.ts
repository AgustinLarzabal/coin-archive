import { createSerializationAdapter } from "@tanstack/react-router"

import {
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidCurrencySlugError,
  InvalidEngraverSlugError,
  InvalidIssuerCodeError,
  InvalidMintSlugError,
  InvalidRulingAuthoritySlugError,
} from "./archive/coins"
import {
  CurrencyListRequestError,
  InvalidCurrencyListResponseError,
} from "./archive/currencies"
import {
  DistributionListRequestError,
  InvalidDistributionListResponseError,
} from "./archive/distributions"
import {
  EngraverListRequestError,
  InvalidEngraverListResponseError,
} from "./archive/engravers"
import {
  InvalidIssuerListResponseError,
  IssuerListRequestError,
} from "./archive/issuers"
import {
  InvalidMintListResponseError,
  MintListRequestError,
} from "./archive/mints"
import {
  InvalidRulingAuthorityListResponseError,
  RulingAuthorityListRequestError,
} from "./archive/rulers"

export {
  coinDetailQueryOptions,
  coinListQueryOptions,
  CoinNotFoundError,
  InvalidCoinIdError,
  InvalidCoinListResponseError,
  InvalidCoinResponseError,
  InvalidCurrencySlugError,
  InvalidEngraverSlugError,
  InvalidIssuerCodeError,
  InvalidMintSlugError,
  InvalidRulingAuthoritySlugError,
  validateCoinId,
} from "./archive/coins"
export type { CoinListFilters } from "./archive/coins"
export {
  InvalidMintListResponseError,
  mintListQueryOptions,
  MintListRequestError,
} from "./archive/mints"
export {
  currencyListQueryOptions,
  CurrencyListRequestError,
  InvalidCurrencyListResponseError,
} from "./archive/currencies"
export {
  distributionListQueryOptions,
  DistributionListRequestError,
  InvalidDistributionListResponseError,
} from "./archive/distributions"
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
export {
  InvalidRulingAuthorityListResponseError,
  rulingAuthorityListQueryOptions,
  RulingAuthorityListRequestError,
} from "./archive/rulers"

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
  errorAdapter("InvalidMintListResponseError", InvalidMintListResponseError),
  errorAdapter("MintListRequestError", MintListRequestError),
  errorAdapter("InvalidCoinIdError", InvalidCoinIdError),
  errorAdapter("InvalidCoinResponseError", InvalidCoinResponseError),
  errorAdapter("InvalidCoinListResponseError", InvalidCoinListResponseError),
  errorAdapter(
    "InvalidCurrencyListResponseError",
    InvalidCurrencyListResponseError
  ),
  errorAdapter("CurrencyListRequestError", CurrencyListRequestError),
  errorAdapter(
    "InvalidDistributionListResponseError",
    InvalidDistributionListResponseError
  ),
  errorAdapter("DistributionListRequestError", DistributionListRequestError),
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
  errorAdapter("InvalidMintSlugError", InvalidMintSlugError),
  errorAdapter("InvalidCurrencySlugError", InvalidCurrencySlugError),
  errorAdapter("InvalidEngraverSlugError", InvalidEngraverSlugError),
  errorAdapter(
    "InvalidRulingAuthoritySlugError",
    InvalidRulingAuthoritySlugError
  ),
  errorAdapter(
    "InvalidRulingAuthorityListResponseError",
    InvalidRulingAuthorityListResponseError
  ),
  errorAdapter(
    "RulingAuthorityListRequestError",
    RulingAuthorityListRequestError
  ),
]
