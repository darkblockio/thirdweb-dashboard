import { KeyFeatureLayout } from "./KeyFeatureLayout";
import { Box, Flex, GridItem, SimpleGrid } from "@chakra-ui/react";
import { ChakraNextImage as Image } from "components/Image";
import React from "react";
import { Heading, TrackedLink } from "tw-components";

const TRACKING_CATEGORY = "how_it_works_section";

const devTools = [
  {
    icon: require("/public/assets/landingpage/howitworks-contractkit.png"),
    title: "ContractKit",
    href: "/contractkit",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-explore.png"),
    title: "Explore",
    href: "/explore",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-sdk.png"),
    title: "SDK",
    href: "/sdk",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-ui.png"),
    title: "UI Components",
    href: "/ui-components",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-deploy.png"),
    title: "Deploy",
    href: "/deploy",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-publish.png"),
    title: "Publish",
    href: "/publish",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-dashboard.png"),
    title: "Dashboard",
    href: "/dashboards",
  },
];

const infrastructure = [
  {
    icon: require("/public/assets/landingpage/howitworks-indexer.png"),
    title: "Data Feeds",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-gasless.png"),
    title: "Gasless Relayer",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-fiat.png"),
    title: "Fiat On-Ramp",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-storage.png"),
    title: "Storage",
    href: "/storage",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-wallet.png"),
    title: "Wallet",
  },
  {
    icon: require("/public/assets/landingpage/howitworks-auth.png"),
    title: "Auth",
    href: "/auth",
  },
];

type Item = {
  icon: any;
  title: string;
  href?: string;
};
const Item: React.FC<{ item: Item }> = ({ item }) => {
  return item.href ? (
    <Flex
      flexDir="column"
      align="center"
      gap="2.5"
      as={TrackedLink}
      href={item.href}
      category={TRACKING_CATEGORY}
      label={item.title.replace(" ", "_").toLowerCase()}
      transition="opacity 0.2s"
      _hover={{ opacity: 0.8, textDecoration: "none" }}
    >
      <Image w="10" h="10" alt="" src={item.icon} />
      <Heading
        size="title.xs"
        color="#A0A0A0"
        fontSize="0.7rem"
        textAlign="center"
        as="h5"
      >
        {item.title}
      </Heading>
    </Flex>
  ) : (
    <Flex flexDir="column" align="center" gap="2.5">
      <Image w="10" h="10" alt="" src={item.icon} />
      <Heading
        size="title.xs"
        color="#A0A0A0"
        fontSize="0.7rem"
        textAlign="center"
        as="h5"
      >
        {item.title}
      </Heading>
    </Flex>
  );
};

export const HowItWorksSection: React.FC = () => {
  return (
    <KeyFeatureLayout
      title="How it works"
      titleGradient="linear-gradient(70deg, #A3469D, #B799D5)"
      headline="Building for web3 has never been easier."
      description="Powerful dev tools and managed infrastructure services that simplify the entire web3 development cycle."
    >
      <Image
        w="14"
        h="14"
        src={require("/public/assets/landingpage/howitworks-logo.png")}
        alt=""
      />
      <Box w="5px" bg="#0A0A0A" h="7" mt="-1" />
      <Box w="55%" pt="6" pb="1" border="5px #0A0A0A solid" borderBottom="0" />
      <Flex
        align="stretch"
        justify="space-between"
        wrap={{ base: "wrap", md: "nowrap" }}
        gap={4}
        w="full"
      >
        <Flex
          display={{ base: "none", xl: "flex" }}
          flex={1}
          order={{ base: 2, md: 1 }}
          rounded="8"
          border="2px #171717 solid"
          justify="between"
          flexDir="column"
          align="center"
          pb={9}
          w={{ md: "full" }}
          maxW={36}
          maxH="22rem"
        >
          <Image
            opacity={0.55}
            w="full"
            src={require("/public/assets/landingpage/howitworks-apps.png")}
            alt=""
            mb={6}
          />
          <Heading
            opacity={0.55}
            size="title.xs"
            color="#A0A0A0"
            fontSize="0.7rem"
            textAlign="center"
            mt="auto"
            as="span"
          >
            APPS & GAMES
          </Heading>
        </Flex>
        <Flex
          flex={1}
          display={{ base: "none", xl: "flex" }}
          order={{ base: 3, md: 3 }}
          rounded="8"
          border="2px #171717 solid"
          justify="between"
          flexDir="column"
          align="center"
          pb={9}
          w={{ md: "full" }}
          maxW={36}
          maxH="22rem"
        >
          <Image
            opacity={0.55}
            w="full"
            src={require("/public/assets/landingpage/howitworks-networks.png")}
            alt=""
            mb={6}
          />
          <Heading
            opacity={0.55}
            mt="auto"
            size="title.xs"
            color="#A0A0A0"
            fontSize="0.7rem"
            textAlign="center"
            as="span"
          >
            DECENTRALIZED NETWORKS
          </Heading>
        </Flex>
        <Flex
          w={{ base: "full", md: "auto" }}
          order={{ base: 1, md: 2 }}
          grow={1}
          flexDir="column"
        >
          <Heading
            size="title.xs"
            color="#A0A0A0"
            textAlign="center"
            fontSize="0.7rem"
            letterSpacing={1.1}
            lineHeight="1"
            mt="-0.95rem"
            pb={2}
            as="h4"
          >
            DEV TOOLS
          </Heading>
          <Flex rounded="8" border="2px #171717 solid" w="full" h="full">
            <SimpleGrid
              my="auto"
              w="full"
              columns={{ base: 3, lg: 7 }}
              gap="1rem 0"
              py={6}
              px={4}
            >
              {devTools.map((item, index) => (
                <GridItem
                  key={item.title}
                  colSpan={{
                    base: index === 6 ? 3 : 1,
                    lg: 1,
                  }}
                >
                  <Item item={item} />
                </GridItem>
              ))}
            </SimpleGrid>
          </Flex>
          <Heading
            size="title.xs"
            color="#A0A0A0"
            textAlign="center"
            fontSize="0.7rem"
            letterSpacing={1.1}
            lineHeight="1"
            mt={{ base: 4, md: 8 }}
            pb={2}
            as="h4"
          >
            INFRASTRUCTURE
          </Heading>
          <Flex rounded="8" border="2px #171717 solid" w="full" h="full">
            <SimpleGrid
              my="auto"
              w="full"
              columns={{ base: 3, lg: 6 }}
              gap="1rem 0"
              py={6}
              px={4}
            >
              {infrastructure.map((item) => (
                <GridItem key={item.title}>
                  <Item item={item} />
                </GridItem>
              ))}
            </SimpleGrid>
          </Flex>
        </Flex>
      </Flex>
    </KeyFeatureLayout>
  );
};
