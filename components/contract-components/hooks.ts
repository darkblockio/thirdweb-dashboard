import {
  stepAddToRegistry,
  stepDeploy,
  useDeployContextModal,
} from "./contract-deploy-form/deploy-context-modal";
import { ContractId } from "./types";
import {
  addContractToMultiChainRegistry,
  isContractIdBuiltInContract,
} from "./utils";
import { contractKeys, networkKeys } from "@3rdweb-sdk/react";
import { useMutationWithInvalidate } from "@3rdweb-sdk/react/hooks/query/useQueryWithNetwork";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Polygon } from "@thirdweb-dev/chains";
import {
  useAddress,
  useChainId,
  useSDK,
  useSDKChainId,
  useSigner,
} from "@thirdweb-dev/react";
import { FeatureWithEnabled } from "@thirdweb-dev/sdk/dist/declarations/src/evm/constants/contract-features";
import {
  Abi,
  ContractInfoSchema,
  ContractType,
  ExtraPublishMetadata,
  ProfileMetadata,
  PublishedContract,
  ThirdwebSDK,
  detectFeatures,
  extractConstructorParamsFromAbi,
  extractEventsFromAbi,
  extractFunctionParamsFromAbi,
  extractFunctionsFromAbi,
  fetchPreDeployMetadata,
} from "@thirdweb-dev/sdk/evm";
import { BuiltinContractMap } from "constants/mappings";
import { utils } from "ethers";
import { useConfiguredChain } from "hooks/chains/configureChains";
import { isEnsName } from "lib/ens";
import { getDashboardChainRpc } from "lib/rpc";
import { StorageSingleton, getEVMThirdwebSDK } from "lib/sdk";
import { getAbsoluteUrl } from "lib/vercel-utils";
import { StaticImageData } from "next/image";
import { useMemo } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";

export interface ContractPublishMetadata {
  image: string | StaticImageData;
  name: string;
  description?: string;
  abi?: Abi;
  bytecode?: string;
  deployDisabled?: boolean;
  info?: z.infer<typeof ContractInfoSchema>;
  licenses?: string[];
  compilerMetadata?: Record<string, any>;
  analytics?: Record<string, any>;
}

function removeUndefinedFromObject(obj: Record<string, any>) {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

// metadata PRE publish, only has the compiler output info (from CLI)
export async function fetchContractPublishMetadataFromURI(
  contractId: ContractId,
) {
  const contractIdIpfsHash = toContractIdIpfsHash(contractId);

  if (isContractIdBuiltInContract(contractId)) {
    const details = BuiltinContractMap[contractIdIpfsHash as ContractType];
    return {
      image: details.icon,
      name: details.title,
      deployDisabled: details.comingSoon,
      description: details.description,
    };
  }

  invariant(contractId !== "ipfs://undefined", "uri can't be undefined");
  let resolved;
  try {
    resolved = await fetchPreDeployMetadata(
      contractIdIpfsHash,
      StorageSingleton,
    );
  } catch (err) {
    console.error("failed to resolvePreDeployMetadata", err);
  }

  if (!resolved) {
    return {
      name: "",
      image: "custom",
    };
  }

  return {
    image: (resolved as any)?.image || "custom",
    name: resolved.name,
    description: resolved.info?.title || "",
    abi: resolved.abi,
    info: removeUndefinedFromObject(resolved.info),
    licenses: resolved.licenses,
    compilerMetadata: resolved.metadata,
    analytics: removeUndefinedFromObject(resolved.analytics),
  };
}

export function useContractPublishMetadataFromURI(contractId: ContractId) {
  return useQuery<ContractPublishMetadata>(
    ["publish-metadata", contractId],
    () => fetchContractPublishMetadataFromURI(contractId),
    {
      enabled: !!contractId,
    },
  );
}

// metadata PRE publish, only contains the compiler output
// if passing an address, also fetches the latest version of the matching contract
export function useContractPrePublishMetadata(uri: string, address?: string) {
  const contractIdIpfsHash = toContractIdIpfsHash(uri);

  return useQuery(
    ["pre-publish-metadata", uri, address],
    async () => {
      invariant(
        !isContractIdBuiltInContract(uri),
        "Skipping publish metadata fetch for built-in contract",
      );
      invariant(address, "address is not defined");
      // TODO: Make this nicer.
      invariant(uri !== "ipfs://undefined", "uri can't be undefined");
      const sdk = getEVMThirdwebSDK(
        Polygon.chainId,
        getDashboardChainRpc(Polygon),
      );
      return await sdk
        ?.getPublisher()
        .fetchPrePublishMetadata(contractIdIpfsHash, address);
    },
    {
      enabled: !!uri && !!address,
    },
  );
}

async function fetchFullPublishMetadata(
  sdk: ThirdwebSDK,
  uri: string,
  queryClient: QueryClient,
) {
  const rawPublishMetadata = await sdk
    .getPublisher()
    .fetchFullPublishMetadata(uri);

  const ensResult = rawPublishMetadata.publisher
    ? await queryClient.fetchQuery(ensQuery(rawPublishMetadata.publisher))
    : undefined;

  return {
    ...rawPublishMetadata,
    publisher:
      ensResult?.ensName || ensResult?.address || rawPublishMetadata.publisher,
  };
}

// Metadata POST publish, contains all the extra information filled in by the user
export function useContractFullPublishMetadata(uri: string) {
  const contractIdIpfsHash = toContractIdIpfsHash(uri);
  const sdk = getEVMThirdwebSDK(Polygon.chainId, getDashboardChainRpc(Polygon));
  const queryClient = useQueryClient();

  return useQuery(
    ["full-publish-metadata", uri],
    async () => {
      invariant(
        !isContractIdBuiltInContract(uri),
        "Skipping publish metadata fetch for built-in contract",
      );

      invariant(sdk, "sdk is not defined");
      // TODO: Make this nicer.
      invariant(uri !== "ipfs://undefined", "uri can't be undefined");
      return await fetchFullPublishMetadata(
        sdk,
        contractIdIpfsHash,
        queryClient,
      );
    },
    {
      enabled: !!uri && !!sdk,
    },
  );
}

async function fetchPublisherProfile(publisherAddress?: string | null) {
  const sdk = getEVMThirdwebSDK(Polygon.chainId, getDashboardChainRpc(Polygon));
  invariant(publisherAddress, "address is not defined");
  return await sdk.getPublisher().getPublisherProfile(publisherAddress);
}

export function publisherProfileQuery(publisherAddress?: string) {
  return {
    queryKey: ["releaser-profile", publisherAddress],
    queryFn: () => fetchPublisherProfile(publisherAddress),
    enabled: !!publisherAddress,
    // 24h
    cacheTime: 60 * 60 * 24 * 1000,
    // 1h
    staleTime: 60 * 60 * 1000,
    // default to the one we know already
  };
}

export function usePublisherProfile(publisherAddress?: string) {
  return useQuery(publisherProfileQuery(publisherAddress));
}

export async function fetchAllVersions(
  sdk?: ThirdwebSDK,
  publisherAddress?: string,
  contractName?: string,
) {
  invariant(publisherAddress, "address is not defined");
  invariant(contractName, "contract name is not defined");
  invariant(sdk, "sdk not provided");
  const allVersions = await sdk
    .getPublisher()
    .getAllVersions(publisherAddress, contractName);

  const publishedVersions = [];

  for (let i = 0; i < allVersions.length; i++) {
    const contractInfo = await sdk
      .getPublisher()
      .fetchPublishedContractInfo(allVersions[i]);

    publishedVersions.unshift({
      ...allVersions[i],
      version: contractInfo.publishedMetadata.version,
      name: contractInfo.publishedMetadata.name,
      displayName: contractInfo.publishedMetadata.displayName || "",
      description: contractInfo.publishedMetadata.description || "",
      publisher: contractInfo.publishedMetadata.publisher || "",
      audit: contractInfo.publishedMetadata.audit || "",
      logo: contractInfo.publishedMetadata.logo || "",
    });
  }

  return publishedVersions;
}

export function useAllVersions(
  publisherAddress?: string,
  contractName?: string,
) {
  const sdk = getEVMThirdwebSDK(Polygon.chainId, getDashboardChainRpc(Polygon));
  return useQuery(
    ["all-releases", publisherAddress, contractName],
    () => fetchAllVersions(sdk, publisherAddress, contractName),
    {
      enabled: !!publisherAddress && !!contractName && !!sdk,
    },
  );
}

export function usePublishedContractsFromDeploy(
  contractAddress?: string,
  chainId?: number,
) {
  const activeChainId = useSDKChainId();
  const cId = chainId || activeChainId;
  const chainInfo = useConfiguredChain(cId || -1);

  return useQuery(
    (networkKeys.chain(cId) as readonly unknown[]).concat([
      "release-from-deploy",
      contractAddress,
    ]),
    async () => {
      invariant(contractAddress, "contractAddress is not defined");
      invariant(cId, "chain not defined");

      const rpcUrl = chainInfo ? getDashboardChainRpc(chainInfo) : undefined;

      invariant(rpcUrl, "rpcUrl not defined");
      const sdk = getEVMThirdwebSDK(cId, rpcUrl);

      const contractUri = await sdk
        .getPublisher()
        .resolveContractUriFromAddress(contractAddress);

      const polygonSdk = getEVMThirdwebSDK(
        Polygon.chainId,
        getDashboardChainRpc(Polygon),
      );

      return await polygonSdk
        .getPublisher()
        .resolvePublishMetadataFromCompilerMetadata(contractUri);
    },
    {
      enabled: !!contractAddress && !!cId && !!chainInfo,
    },
  );
}

export async function fetchPublishedContractInfo(
  sdk?: ThirdwebSDK,
  contract?: PublishedContract,
) {
  invariant(contract, "contract is not defined");
  invariant(sdk, "sdk not provided");
  return await sdk.getPublisher().fetchPublishedContractInfo(contract);
}

export function usePublishedContractInfo(contract: PublishedContract) {
  const sdk = getEVMThirdwebSDK(Polygon.chainId, getDashboardChainRpc(Polygon));
  return useQuery(
    ["released-contract", contract],
    () => fetchPublishedContractInfo(sdk, contract),
    {
      enabled: !!contract,
    },
  );
}
export function usePublishedContractFunctions(contract: PublishedContract) {
  const { data: meta } = useContractPublishMetadataFromURI(
    contract.metadataUri,
  );
  return meta
    ? extractFunctionsFromAbi(meta.abi as Abi, meta?.compilerMetadata)
    : undefined;
}
export function usePublishedContractEvents(contract: PublishedContract) {
  const { data: meta } = useContractPublishMetadataFromURI(
    contract.metadataUri,
  );
  return meta
    ? extractEventsFromAbi(meta.abi as Abi, meta?.compilerMetadata)
    : undefined;
}

export function usePublishedContractCompilerMetadata(
  contract: PublishedContract,
) {
  return useContractPublishMetadataFromURI(contract.metadataUri);
}

export function useConstructorParamsFromABI(abi?: Abi) {
  return useMemo(() => {
    return abi ? extractConstructorParamsFromAbi(abi) : [];
  }, [abi]);
}

export function useFunctionParamsFromABI(abi?: any, functionName?: string) {
  return useMemo(() => {
    return abi && functionName
      ? extractFunctionParamsFromAbi(abi, functionName)
      : [];
  }, [abi, functionName]);
}

export function toContractIdIpfsHash(contractId: ContractId) {
  if (
    isContractIdBuiltInContract(contractId) ||
    contractId?.startsWith("ipfs://")
  ) {
    return contractId;
  }
  return `ipfs://${contractId}`;
}

interface PublishMutationData {
  predeployUri: string;
  extraMetadata: ExtraPublishMetadata;
  contractName?: string;
}

export function usePublishMutation() {
  // this has to actually have the signer!
  const sdk = useSDK();

  const address = useAddress();

  return useMutationWithInvalidate(
    async ({ predeployUri, extraMetadata }: PublishMutationData) => {
      invariant(
        sdk && "getPublisher" in sdk,
        "sdk is not ready or does not support publishing",
      );
      const contractIdIpfsHash = toContractIdIpfsHash(predeployUri);
      await sdk.getPublisher().publish(contractIdIpfsHash, extraMetadata);
    },
    {
      onSuccess: (_data, variables, _options, invalidate) => {
        return Promise.all([
          invalidate([["pre-publish-metadata", variables.predeployUri]]),
          fetch(
            `/api/revalidate/publish?address=${address}&contractName=${variables.contractName}`,
          ).catch((err) => console.error("failed to revalidate", err)),
        ]);
      },
    },
  );
}

export function useEditProfileMutation() {
  const sdk = useSDK();
  const address = useAddress();

  return useMutationWithInvalidate(
    async (data: ProfileMetadata) => {
      invariant(sdk, "sdk not provided");
      await sdk.getPublisher().updatePublisherProfile(data);
    },
    {
      onSuccess: (_data, _variables, _options, invalidate) => {
        return Promise.all([
          invalidate([["releaser-profile", address]]),
          fetch(`/api/revalidate/publish?address=${address}`).catch((err) =>
            console.error("failed to revalidate", err),
          ),
        ]);
      },
    },
  );
}

interface ContractDeployMutationParams {
  constructorParams: unknown[];
  addToDashboard?: boolean;
}

export function useCustomContractDeployMutation(
  ipfsHash: string,
  forceDirectDeploy?: boolean,
) {
  const sdk = useSDK();
  const queryClient = useQueryClient();
  const walletAddress = useAddress();
  const chainId = useChainId();
  const signer = useSigner();
  const deployContext = useDeployContextModal();

  return useMutation(
    async (data: ContractDeployMutationParams) => {
      invariant(
        sdk && "getPublisher" in sdk,
        "sdk is not ready or does not support publishing",
      );

      // open the modal with the appropriate steps
      deployContext.open(
        data.addToDashboard ? [stepDeploy, stepAddToRegistry] : [stepDeploy],
      );

      let contractAddress: string;
      try {
        // deploy contract
        contractAddress = await sdk.deployer.deployContractFromUri(
          ipfsHash.startsWith("ipfs://") ? ipfsHash : `ipfs://${ipfsHash}`,
          data.constructorParams,
          {
            forceDirectDeploy,
          },
        );

        deployContext.nextStep();
      } catch (e) {
        // failed to deploy contract - close modal for now
        deployContext.close();
        // re-throw error
        throw e;
      }
      try {
        // let user decide if they want this or not
        if (data.addToDashboard) {
          invariant(chainId, "chainId is not provided");
          await addContractToMultiChainRegistry(
            {
              address: contractAddress,
              chainId,
            },
            signer,
          );

          deployContext.nextStep();
        }
      } catch (e) {
        // failed to add to dashboard - for now just close the modal
        deployContext.close();
        // not re-throwing the error, this is not technically a failure to deploy, just to add to dashboard - the contract is deployed already at this stage
      }

      // always close the modal
      deployContext.close();

      return contractAddress;
    },
    {
      onSuccess: async () => {
        return await queryClient.invalidateQueries([
          ...networkKeys.chain(chainId),
          ...contractKeys.list(walletAddress),
          [networkKeys.multiChainRegistry, walletAddress],
        ]);
      },
    },
  );
}

export async function fetchPublishedContracts(
  sdk: ThirdwebSDK,
  queryClient: QueryClient,
  address?: string | null,
) {
  invariant(sdk, "sdk not provided");
  invariant(address, "address is not defined");
  const tempResult = ((await sdk.getPublisher().getAll(address)) || []).filter(
    (c) => c.id,
  );
  return await Promise.all(
    tempResult.map(async (c) => ({
      ...c,
      metadata: await fetchFullPublishMetadata(sdk, c.metadataUri, queryClient),
    })),
  );
}

export type PublishedContractDetails = Awaited<
  ReturnType<typeof fetchPublishedContracts>
>[number];

export function usePublishedContractsQuery(address?: string) {
  const sdk = getEVMThirdwebSDK(Polygon.chainId, getDashboardChainRpc(Polygon));
  const queryClient = useQueryClient();
  return useQuery<PublishedContractDetails[]>(
    ["published-contracts", address],
    () => {
      invariant(sdk, "sdk not provided");
      return fetchPublishedContracts(sdk, queryClient, address);
    },
    {
      enabled: !!address && !!sdk,
    },
  );
}

const ALWAYS_SUGGESTED = ["ContractMetadata", "Permissions"];

export function extractExtensions(
  input: ReturnType<typeof detectFeatures>,
  enabledExtensions: FeatureWithEnabled[] = [],
  suggestedExtensions: FeatureWithEnabled[] = [],
  parent = "__ROOT__",
) {
  if (!input) {
    return {
      enabledExtensions,
      suggestedExtensions,
    };
  }
  for (const extensionKey in input) {
    const extension = input[extensionKey];
    // if extension is enabled, then add it to enabledFeatures
    if (extension.enabled) {
      enabledExtensions.push(extension);
    }
    // otherwise if it is disabled, but it's parent is enabled or suggested, then add it to suggestedFeatures
    else if (
      enabledExtensions.findIndex((f) => f.name === parent) > -1 ||
      ALWAYS_SUGGESTED.includes(extension.name)
    ) {
      suggestedExtensions.push(extension);
    }
    // recurse
    extractExtensions(
      extension.features,
      enabledExtensions,
      suggestedExtensions,
      extension.name,
    );
  }

  return {
    enabledExtensions,
    suggestedExtensions,
  };
}

export function useContractDetectedExtensions(abi?: any) {
  const features = useMemo(() => {
    if (abi) {
      return extractExtensions(detectFeatures(abi));
    }
    return undefined;
  }, [abi]);
  return features;
}

export function useContractEnabledExtensions(abi?: any) {
  const extensions = useContractDetectedExtensions(abi);
  return extensions ? extensions.enabledExtensions : [];
}

export function ensQuery(addressOrEnsName?: string) {
  // if the address is `thirdweb.eth` we actually want `deployer.thirdweb.eth` here...
  if (addressOrEnsName === "thirdweb.eth") {
    addressOrEnsName = "deployer.thirdweb.eth";
  }
  const placeholderData = {
    address: utils.isAddress(addressOrEnsName || "")
      ? addressOrEnsName || null
      : null,
    ensName: null,
  };
  return {
    queryKey: ["ens", addressOrEnsName],
    queryFn: async () => {
      if (!addressOrEnsName) {
        return placeholderData;
      }
      // if it is neither an address or an ens name then return the placeholder data only
      if (!utils.isAddress(addressOrEnsName) && !isEnsName(addressOrEnsName)) {
        throw new Error("Invalid address or ENS name.");
      }
      const res = await fetch(
        `${getAbsoluteUrl()}/api/ens/${addressOrEnsName}`,
      );
      const { address, ensName } = (await res.json()) as {
        address: string | null;
        ensName: string | null;
      };

      if (isEnsName(addressOrEnsName) && !address) {
        throw new Error("Failed to resolve ENS name.");
      }

      return {
        address,
        ensName,
      };
    },
    enabled:
      !!addressOrEnsName &&
      (utils.isAddress(addressOrEnsName) || isEnsName(addressOrEnsName)),
    // 24h
    cacheTime: 60 * 60 * 24 * 1000,
    // 1h
    staleTime: 60 * 60 * 1000,
    // default to the one we know already
    placeholderData,
    retry: false,
  } as const;
}

export function useEns(addressOrEnsName?: string) {
  return useQuery(ensQuery(addressOrEnsName));
}

export function fetchEns(queryClient: QueryClient, addressOrEnsName: string) {
  return queryClient.fetchQuery(ensQuery(addressOrEnsName));
}

export function useContractFunctions(abi: Abi) {
  return abi ? extractFunctionsFromAbi(abi) : undefined;
}

export function useContractEvents(abi: Abi) {
  return abi ? extractEventsFromAbi(abi) : undefined;
}
