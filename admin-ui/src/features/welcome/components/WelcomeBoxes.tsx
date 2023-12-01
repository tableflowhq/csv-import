import { ReactNode } from "react";
import { Box, chakra, Flex, Link, SimpleGrid, Stat, StatLabel, StatNumber, useColorModeValue } from "@chakra-ui/react";
import { FiBookOpen, FiUsers, FiVideo } from "react-icons/fi";

interface StatsCardProps {
  title: string;
  subTitle: string;
  icon: ReactNode;
  path: string;
  isExternal: boolean;
}

function WelcomeLink({ title, subTitle, icon, path, isExternal }: StatsCardProps) {
  return (
    <Link role="group" href={path} textDecoration={"none"} isExternal={isExternal}>
      <Stat
        px={{ base: 2, md: 4 }}
        py={"5"}
        shadow={"xl"}
        border={"1px solid"}
        borderColor={useColorModeValue("gray.800", "gray.500")}
        transition={"all 0.1s ease-in-out 0s"}
        _groupHover={{
          borderColor: "var(--color-primary)",
        }}
        rounded={"lg"}>
        <Flex justifyContent={"space-between"}>
          <Box mr={3}>
            <StatLabel fontWeight={"medium"} isTruncated>
              {subTitle}
            </StatLabel>
            <StatNumber fontSize={"2xl"} fontWeight={"medium"}>
              {title}
            </StatNumber>
          </Box>
          <Box
            my={"auto"}
            color={useColorModeValue("gray.800", "gray.200")}
            alignContent={"center"}
            transition={"all 0.1s ease-in-out 0s"}
            mr={2}
            _groupHover={{
              color: "var(--color-primary)",
            }}>
            {icon}
          </Box>
        </Flex>
      </Stat>
    </Link>
  );
}

export default function WelcomeBoxes() {
  return (
    <SimpleGrid columns={{ base: 1 }} spacing={{ base: 3, lg: 5 }}>
      <WelcomeLink
        title={"Our docs"}
        subTitle={"Take a look at"}
        path="https://tableflow.com/docs/"
        isExternal={true}
        icon={<FiBookOpen size={"3em"} />}
      />
      <WelcomeLink
        title={"Book a call"}
        subTitle={"Learn more"}
        path="https://calendly.com/mitchpatin/30"
        isExternal={true}
        icon={<FiVideo size={"3em"} />}
      />
      <WelcomeLink title={"Invite your team"} subTitle={"Coming soon!"} path="/" isExternal={false} icon={<FiUsers size={"3em"} />} />
    </SimpleGrid>
  );
}
