import {
  Box,
  Flex,
  Heading,
  List,
  ListItem,
  Spinner,
  FormControl,
  LightMode,
  Switch,
  Select,
  Text,
  SimpleGrid,
  useColorModeValue,
  useDisclosure,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useClipboard,
  Center,
  Icon,
  useToast,
  Stack,
  Tooltip,
  Collapse,
} from "@chakra-ui/react";
import { useActivity } from "@3rdweb-sdk/react/hooks/useActivity";
import { useAddress } from "@thirdweb-dev/react";
import { AiOutlineQuestionCircle } from "@react-icons/all-files/ai/AiOutlineQuestionCircle";
import type { ContractEvent } from "@thirdweb-dev/sdk/evm";
import { AnimatePresence, motion } from "framer-motion";
import { useSingleQueryParam } from "hooks/useQueryParam";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiCopy } from "react-icons/fi";
import {
  Button,
  Card,
  CodeBlock,
  FormLabel,
} from "tw-components";
import { bigNumberReplacer } from "utils/bignumber";


interface EventsFeedProps {
  contractAddress?: string;
}

export const EventsFeed: React.FC<EventsFeedProps> = ({ contractAddress }) => {
  const [arweaveData, setArweaveData] = useState([]);
  const [arweaveDataLoading, setArweaveDataLoading] = useState(false);
  const [arweaveDataError, setArweaveDataError] = useState(null);
  const toast = useToast();
  const chainName = useSingleQueryParam("networkOrAddress");
  const { onCopy, setValue } = useClipboard(arweaveData.id);

  const handleCopy = (index) => {
    setValue(arweaveData[index].id);
    onCopy();
    toast({
      variant: "solid",
      position: "bottom",
      title: "Transaction hash copied.",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  useEffect(() => {
    const endpoint = "https://arweave.net/graphql";
    const query = `
      query {
        transactions(
          tags: [
            { name: "NFT-Contract", values: "${contractAddress.toLowerCase()}" }
          ]
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }
    `;

    const fetchArweaveData = async () => {
      setArweaveDataLoading(true);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await response.json();
        const seenDataHashes = new Set();
        const arweaveData = data.transactions.edges.reduce((acc, edge) => {
          const { id, tags } = edge.node;
          const dataHashTag = tags.find(tag => tag.name === "Data-Hash");
          if (dataHashTag) {
            const dataHash = dataHashTag.value;
            if (!seenDataHashes.has(dataHash)) {
              seenDataHashes.add(dataHash);
              const tagMap = tags.reduce((tagAcc, tag) => {
                tagAcc[tag.name] = tag.value;
                return tagAcc;
              }, {});
              acc.push({
                id,
                ...tagMap,
              });
            }
          }
          return acc;
        }, []);
        setArweaveData(arweaveData);
      } catch (error) {
        setArweaveDataError(error);
      } finally {
        setArweaveDataLoading(false);
      }
    };

    fetchArweaveData();
  }, [contractAddress, setArweaveData, setArweaveDataLoading, setArweaveDataError]);

  useEffect(() => {

    console.log(arweaveData);
    debugger;
  }, [arweaveData]);

  return (
    <Flex gap={6} flexDirection="column">
      <Flex align="center" justify="space-between" w="full">
        <Flex gap={4} alignItems="center">
          {/* <Heading flexShrink={0} size="title.sm">
            Upgrades
          </Heading> */}

        </Flex>
        <Box>
          {/* <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="auto-update" mb="0">
              Auto-Update
            </FormLabel>
            <LightMode>
              <Switch
                isChecked={false}
                onChange={() => {}}
                id="auto-update"
              />
            </LightMode>
          </FormControl> */}
        </Box>

      </Flex>
      {contractAddress && (
        <Box>
          {arweaveDataLoading ? (
            <Spinner size="xl" />
          ) : arweaveDataError ? (
            <Text color="red.500">
              Failed to fetch data from Arweave: {arweaveDataError.message}
            </Text>
          ) : (
            <List>

              <Card p={0} overflow="hidden">
                <SimpleGrid
                  gap={2}
                  columns={12}
                  borderBottomWidth="1px"
                  borderColor="borderColor"
                  padding={4}
                  bg="blackAlpha.50"
                  _dark={{ bg: "whiteAlpha.50" }}
                >
                  <Heading gridColumn="span 4" size="title.sm">
                    Transaction
                  </Heading>
                  <Heading gridColumn="span 5" size="label.sm">
                    Type
                  </Heading>
                  <Heading gridColumn="span 3" size="label.sm">
                    Date
                  </Heading>
                </SimpleGrid>

                <Accordion
                  as={AnimatePresence}
                  initial={false}
                  allowMultiple
                  defaultIndex={[]}
                >
                  {arweaveData?.map((item, index) => (
                    <AccordionItem
                      key={index}>
                      <AccordionButton>
                        <SimpleGrid columns={[3, 12]} gap={2} padding={4} >

                          <Box gridColumn="span 3">
                            <Stack direction="row" align="center" spacing={3}>
                              <Tooltip
                                p={0}
                                bg="transparent"
                                boxShadow="none"
                                label={
                                  <Card py={2} px={4}>
                                    <Text size="label.sm">
                                      Copy transaction ID to clipboard
                                    </Text>
                                  </Card>
                                }
                              >
                                <Button
                                  size="sm"
                                  bg="transparent"
                                  onClick={() => {
                                    handleCopy(index);
                                  }}
                                >
                                  <Icon as={FiCopy} boxSize={3} />
                                </Button>
                              </Tooltip>
                              <Text fontFamily="mono" noOfLines={1}>
                                {item.id.slice(0, 32)}...
                              </Text>
                            </Stack>
                          </Box>


                          <Box gridColumn={['span 5', 'span 4']} fontWeight="bold">
                            {/* {item.Name} */}
                            placeholder type
                          </Box>
                          <Box gridColumn={['span 3', 'span 4']} textAlign="right">
                            {item['Date-Created']}
                          </Box>
                          <Box>
                            <Icon as={FiChevronDown} />
                          </Box>
                        </SimpleGrid>
                        <Icon
                          as={FiChevronDown}
                          display={['block', 'none']}
                          ml="auto"
                          boxSize={4}
                        />
                      </AccordionButton>
                      <AccordionPanel>
                        <Stack spacing={4}>
                          <Heading size="subtitle.sm" fontWeight="bold">
                            Transaction Data
                          </Heading>
                          <Divider />
                          <TransactionData
                            name="Transaction ID"
                            value={item.id}
                            description={`
                The transaction ID is a unique identifier for this transaction on the Arweave blockchain.
                `}
                          />
                          <React.Fragment key={item.id}>
                            <SimpleGrid columns={[1, 2]} gap={4}>
                              <Box>
                                <Text fontWeight="bold">Tags</Text>
                              </Box>
                              <CodeBlock
                                gridColumn="span 9"
                                language="json"
                                code={JSON.stringify(item, null, 2)}
                              />
                            </SimpleGrid>
                          </React.Fragment>

                          {/* {Object.keys(item)
            .filter(
              (key) =>
                !['id', 'Name', 'ArtId', 'Date-Created'].includes(key),
            )
            .map((key) => (
              <Box key={key}>
                <Text fontWeight="bold">{key}:</Text>
                <Text>{item[key]}</Text>
              </Box>
            ))} */}
                        </Stack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </List>
          )}
        </Box>
      )}
    </Flex>
  );
};

interface TransactionDataProps {
  name: string;
  value: string | number;
  description: string;
}

const TransactionData: React.FC<TransactionDataProps> = ({
  name,
  value,
  description,
}) => {
  return (
    <>
      <SimpleGrid columns={12} gap={2}>
        <Stack direction="row" align="center" gridColumn="span 3">
          <Tooltip
            p={0}
            bg="transparent"
            boxShadow="none"
            label={
              <Card py={2} px={4}>
                <Text size="label.sm">{description}</Text>
              </Card>
            }
          >
            <Center>
              <Icon as={AiOutlineQuestionCircle} color="gray.600" />
            </Center>
          </Tooltip>

          <Text fontWeight="bold">{name}</Text>
        </Stack>

        <Text gridColumn="span 9">{value}</Text>
      </SimpleGrid>
      <Divider />
    </>
  );
};
