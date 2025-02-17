import { ContractId } from "./types";
import { Polygon } from "@thirdweb-dev/chains";
import { FeatureName } from "@thirdweb-dev/sdk/dist/declarations/src/evm/constants/contract-features";
import {
  Abi,
  PREBUILT_CONTRACTS_MAP,
  ValidContractInstance,
  isFeatureEnabled,
} from "@thirdweb-dev/sdk/evm";
import { Signer } from "ethers";
import { getDashboardChainRpc } from "lib/rpc";
import { getEVMThirdwebSDK } from "lib/sdk";

export function isContractIdBuiltInContract(
  contractId: ContractId,
): contractId is keyof typeof PREBUILT_CONTRACTS_MAP {
  return contractId in PREBUILT_CONTRACTS_MAP;
}

export function detectFeatures<TContract extends ValidContractInstance | null>(
  contract: ValidContractInstance | null | undefined,
  features: FeatureName[],
  strategy: "any" | "all" = "any",
): contract is TContract {
  if (!contract) {
    return false;
  }
  if (!("abi" in contract)) {
    return false;
  }

  if (strategy === "any") {
    return features.some((feature) =>
      isFeatureEnabled(contract.abi as Abi, feature),
    );
  }

  return features.every((feature) =>
    isFeatureEnabled(contract.abi as Abi, feature),
  );
}

export function getGaslessPolygonSDK(signer?: Signer) {
  const polygonSDK = getEVMThirdwebSDK(
    Polygon.chainId,
    getDashboardChainRpc(Polygon),
    {
      gasless: {
        openzeppelin: {
          relayerUrl:
            "https://api.defender.openzeppelin.com/autotasks/dad61716-3624-46c9-874f-0e73f15f04d5/runs/webhook/7d6a1834-dd33-4b7b-8af4-b6b4719a0b97/FdHMqyF3p6MGHw6K2nkLsv",
          relayerForwarderAddress: "0xEbc1977d1aC2fe1F6DAaF584E2957F7c436fcdEF",
        },
        experimentalChainlessSupport: true,
      },
    },
    signer,
  );

  return polygonSDK;
}

// TODO - instead of util - create a hook for this to avoid requiring signer
export async function addContractToMultiChainRegistry(
  contractData: Parameters<
    typeof gaslessPolygonSDK.multiChainRegistry.addContract
  >[0],
  signer?: Signer,
) {
  const gaslessPolygonSDK = getGaslessPolygonSDK(signer);
  await gaslessPolygonSDK.multiChainRegistry.addContract(contractData);
}
