import { NFTLazyMintButton } from "./components/lazy-mint-button";
import { Box, Flex, Grid } from "@chakra-ui/react";
import { useContract } from "@thirdweb-dev/react";
import { detectFeatures } from "components/contract-components/utils";
import { Card, Heading, LinkButton, Text } from "tw-components";
import { EventsFeed } from "./components/events-feed";
import { useEffect } from "react";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import { NFTGetAllTable } from "./components/table";


interface NftUnlockablesPageProps {
  contractAddress?: string;
}

export const NftUnlockablesPage: React.FC<NftUnlockablesPageProps> = ({
  contractAddress,
}) => {

  useEffect(() => {
    window?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const contractQuery = useContract(contractAddress);

  const detectedState = detectFeatures(contractQuery?.contract, [
    "ERC721Enumerable",
    "ERC1155Enumerable",
    "ERC721Supply",
  ]);

  const isErc721 = detectFeatures(contractQuery?.contract, ["ERC721"]);

  const isErc721Claimable = detectFeatures(contractQuery?.contract, [
    "ERC721ClaimPhasesV1",
    "ERC721ClaimPhasesV2",
    "ERC721ClaimConditionsV1",
    "ERC721ClaimConditionsV2",
    "ERC721ClaimCustom",
  ]);

  if (contractQuery.isLoading) {
    // TODO build a skeleton for this
    return <div>Loading...</div>;
  }

  if (!contractQuery?.contract) {
    return null;
  }

  return (
    <Flex direction="column" gap={6}>
      <Flex direction="row" justify="space-between" align="center">
        <Heading size="title.sm">Unlockable content</Heading>
        <Heading size="subtitle.md" color="gray.500"></Heading>
        <Flex gap={2} flexDir={{ base: "column", md: "row" }}>
          <NFTLazyMintButton contractQuery={contractQuery} />
        </Flex>
      </Flex>
      <Tabs>
  <TabList>
    <Tab>Upgrades</Tab>
    <Tab>NFTs</Tab>
    <Tab>Monetization</Tab>
    <Tab>Analytics</Tab>
  </TabList>

  <TabPanels>
    <TabPanel>
    <EventsFeed contractAddress={contractAddress} />
    </TabPanel>
    <TabPanel>
      <NFTGetAllTable contract={contractQuery.contract} />
    </TabPanel>
    <TabPanel>
    <img src="https://nftstorage.link/ipfs/bafkreiat5supqlajhcuxx62i6oirddhx3vh4xrwnueyd5vconrvszkuujy" style={{width: "100%", marginLeft: "auto", marginRight: "auto", paddingTop: "10px"}} />
    </TabPanel>
    <TabPanel>
    
      <img src="https://nftstorage.link/ipfs/bafkreic4soik7mveprcm5uyaezvjatxnpop2emn63qdd2ydzkj4qraek4q" style={{width: "90%", marginLeft: "auto", marginRight: "auto", paddingTop: "20px"}} />  
   
    </TabPanel>
  </TabPanels>
</Tabs>
      
    </Flex> 
  );
};
