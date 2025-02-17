import {
  useConstructorParamsFromABI,
  useFunctionParamsFromABI,
} from "../hooks";
import {
  Divider,
  Flex,
  FormControl,
  Input,
  InputGroup,
  InputRightElement,
  Textarea,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import { SolidityInput } from "contract-ui/components/solidity-inputs";
import { camelToTitle } from "contract-ui/components/solidity-inputs/helpers";
import { getTemplateValuesForType } from "lib/deployment/template-values";
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  Button,
  Card,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Text,
} from "tw-components";

interface ContractParamsFieldsetProps {
  deployParams:
    | ReturnType<typeof useFunctionParamsFromABI>
    | ReturnType<typeof useConstructorParamsFromABI>;
}
export const ContractParamsFieldset: React.FC<ContractParamsFieldsetProps> = ({
  deployParams,
}) => {
  const form = useFormContext();

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex gap={16} direction="column" as="fieldset">
      <Flex gap={2} direction="column">
        <Heading size="title.lg">Contract Parameters</Heading>
        <Text fontStyle="normal">
          These are the parameters users will need to fill in when deploying
          this contract.
        </Text>
      </Flex>
      <Flex flexDir="column" gap={10}>
        {deployParams.map((param, idx) => {
          const paramTemplateValues = getTemplateValuesForType(param.type);
          return (
            <Flex flexDir="column" gap={6} key={`implementation_${param.name}`}>
              <Flex justify="space-between" align="center">
                <Heading size="title.sm">{param.name}</Heading>
                <Text size="body.sm">{param.type}</Text>
              </Flex>
              <Flex gap={6} flexDir="column">
                <Flex gap={4} flexDir={{ base: "column", md: "row" }}>
                  <FormControl
                    isInvalid={
                      !!form.getFieldState(
                        `constructorParams.${param.name}.displayName`,
                        form.formState,
                      ).error
                    }
                  >
                    <FormLabel flex="1" as={Text}>
                      Display Name
                    </FormLabel>
                    <Input
                      {...form.register(
                        `constructorParams.${param.name}.displayName`,
                      )}
                      placeholder={camelToTitle(param.name)}
                    />
                    <FormErrorMessage>
                      {
                        form.getFieldState(
                          `constructorParams.${param.name}.displayName`,
                          form.formState,
                        ).error?.message
                      }
                    </FormErrorMessage>
                  </FormControl>
                  <FormControl
                    isInvalid={
                      !!form.getFieldState(
                        `constructorParams.${param.name}.defaultValue`,
                        form.formState,
                      ).error
                    }
                  >
                    <FormLabel as={Text}>Default Value</FormLabel>

                    <InputGroup size="md">
                      <Flex flexDir="column" w="full">
                        <SolidityInput
                          solidityType={param.type}
                          placeholder={
                            isMobile
                              ? "Pre-filled value."
                              : "This value will be pre-filled in the deploy form."
                          }
                          {...form.register(
                            `constructorParams.${param.name}.defaultValue`,
                          )}
                        />
                      </Flex>
                      {paramTemplateValues.length > 0 && (
                        <InputRightElement width="10.5rem">
                          <Tooltip
                            bg="transparent"
                            boxShadow="none"
                            shouldWrapChildren
                            label={
                              <Card as={Flex} flexDir="column" gap={2}>
                                <Text>
                                  {paramTemplateValues[0].helperText} Click to
                                  apply.
                                </Text>
                              </Card>
                            }
                          >
                            <Button
                              size="xs"
                              padding="3"
                              paddingY="3.5"
                              onClick={() => {
                                form.setValue(
                                  `constructorParams.${param.name}.defaultValue`,
                                  paramTemplateValues[0].value,
                                );
                              }}
                              bgColor="gray.700"
                              _hover={{ bgColor: "gray.800" }}
                            >
                              {paramTemplateValues[0].value}
                            </Button>
                          </Tooltip>
                        </InputRightElement>
                      )}
                    </InputGroup>
                    <FormErrorMessage>
                      {
                        form.getFieldState(
                          `constructorParams.${param.name}.defaultValue`,
                          form.formState,
                        ).error?.message
                      }
                    </FormErrorMessage>
                  </FormControl>
                </Flex>
                <Flex flexDir="column" w="full">
                  <FormControl
                    isInvalid={
                      !!form.getFieldState(
                        `constructorParams.${param.name}.description`,
                        form.formState,
                      ).error
                    }
                  >
                    <FormLabel as={Text}>Description</FormLabel>
                    <Textarea
                      {...form.register(
                        `constructorParams.${param.name}.description`,
                      )}
                      h="full"
                      maxLength={400}
                      placeholder="Enter a description for this parameter."
                    />
                    <FormHelperText>
                      {form.watch(`constructorParams.${param.name}.description`)
                        ?.length ?? 0}
                      /400 characters
                    </FormHelperText>
                  </FormControl>
                </Flex>
              </Flex>
              {idx !== deployParams.length - 1 ? <Divider mt={8} /> : null}
            </Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};
