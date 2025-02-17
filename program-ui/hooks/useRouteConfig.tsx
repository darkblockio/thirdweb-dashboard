import { Flex } from "@chakra-ui/react";
import { useProgram } from "@thirdweb-dev/react/solana";
import { ExtensionDetectedState } from "components/buttons/ExtensionDetectButton";
import { ProgramOverviewTab } from "components/pages/program";
import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { Card, Heading, Text } from "tw-components";

// solana

const LazyPogramClaimConditionsTab = dynamic(() =>
  import("program-ui/common/program-claim-conditions").then(
    ({ ProgramClaimConditionsTab }) => ProgramClaimConditionsTab,
  ),
);
const LazyProgramCodeTab = dynamic(() =>
  import("program-ui/common/program-code").then(
    ({ ProgramCodeTab }) => ProgramCodeTab,
  ),
);
const LazyProgramSettingsTab = dynamic(() =>
  import("program-ui/common/program-settings").then(
    ({ ProgramSettingsTab }) => ProgramSettingsTab,
  ),
);
// end solana

export type EnhancedRoute<T = any> = {
  title: string;
  path: string;
  isEnabled?: ExtensionDetectedState;
  component: ComponentType<T>;
};

export function useProgramRouteConfig(programAddress: string): EnhancedRoute[] {
  const { data: program, isLoading } = useProgram(programAddress);

  return [
    {
      title: "Overview",
      path: "overview",
      // not lazy because it's the typcial landing page
      component: ProgramOverviewTab,
    },
    {
      title: "Claim Conditions",
      path: "claim-conditions",
      component: LazyPogramClaimConditionsTab,
      isEnabled: isLoading
        ? "loading"
        : program?.accountType === "nft-drop"
        ? "enabled"
        : "disabled",
    },
    {
      title: "Code",
      path: "code",
      component: LazyProgramCodeTab,
    },
    {
      title: "Settings",
      path: "settings",
      component:
        program?.accountType === "nft-collection"
          ? LazyProgramSettingsTab
          : () => (
              <>
                <Card>
                  <Flex direction="column" gap={4}>
                    <Heading size="label.lg">⚠️ Coming soon</Heading>
                    <Text>
                      Here you will be able to configure Metadata, Creators,
                      Royalties, etc for your program.
                    </Text>
                  </Flex>
                </Card>
              </>
            ),
    },
  ];
}
