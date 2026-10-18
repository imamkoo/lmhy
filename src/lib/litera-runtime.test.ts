import test from "node:test";
import assert from "node:assert/strict";
import { evaluateIntegrationPreflight, getLiteraApiKeyStatus } from "./litera-runtime";

test("classifies an unset or whitespace-only Litera key as missing", () => {
  assert.equal(getLiteraApiKeyStatus(undefined), "MISSING_API_KEY");
  assert.equal(getLiteraApiKeyStatus("   "), "MISSING_API_KEY");
});

test("classifies a non-empty Litera key as configured without returning its value", () => {
  assert.equal(getLiteraApiKeyStatus("lit_sk_example_secret"), "CONFIGURED");
});

test("evaluates preflight status with mismatch detection", () => {
  assert.equal(
    evaluateIntegrationPreflight({ apiKey: "" }).status,
    "API_KEY_MISSING",
  );

  assert.equal(
    evaluateIntegrationPreflight({
      apiKey: "secret",
      statusResponse: {
        status: "PUBLISHER_MISMATCH",
        apiKeyWallet: "0x1111111111111111111111111111111111111111",
        domainOwnerWallet: "0x2222222222222222222222222222222222222222",
        domain: "letmehearyou.id",
        addedToCORS: true,
      },
    }).status,
    "PUBLISHER_MISMATCH",
  );

  assert.equal(
    evaluateIntegrationPreflight({
      apiKey: "secret",
      configuredPublisherWallet: "0x3333333333333333333333333333333333333333",
      statusResponse: {
        status: "SYNCHRONIZED",
        apiKeyWallet: "0x1111111111111111111111111111111111111111",
        domainOwnerWallet: "0x1111111111111111111111111111111111111111",
        domain: "letmehearyou.id",
        addedToCORS: true,
      },
    }).status,
    "PUBLISHER_MISMATCH",
  );

  assert.equal(
    evaluateIntegrationPreflight({
      apiKey: "secret",
      configuredPublisherWallet: "0x1111111111111111111111111111111111111111",
      statusResponse: {
        status: "SYNCHRONIZED",
        apiKeyWallet: "0x1111111111111111111111111111111111111111",
        domainOwnerWallet: "0x1111111111111111111111111111111111111111",
        domain: "letmehearyou.id",
        addedToCORS: true,
      },
    }).status,
    "SYNCHRONIZED",
  );
});
