import { ReactNode } from "react";
import { Box, chakra, Flex, Link, SimpleGrid, Stat, StatLabel, StatNumber, useColorModeValue } from "@chakra-ui/react";
import { FiBookOpen, FiUsers, FiVideo } from "react-icons/fi";

interface StatsCardProps {
  title: string;
  subTitle: string;
  icon: ReactNode;
  path: string;
}

function WelcomeLink({ title, subTitle, icon, path }: StatsCardProps) {
  return (
    <Link role="group" href={path} textDecoration={"none"}>
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
      <WelcomeLink title={"Our docs"} subTitle={"First take a look to"} path="https://tableflow.com/docs/" icon={<FiBookOpen size={"3em"} />} />
      <WelcomeLink title={"Invite your team"} subTitle={"Don't be a loner"} path="/" icon={<FiUsers size={"3em"} />} />
      <WelcomeLink title={"Book a Call"} subTitle={"Keep in touch"} path="/" icon={<FiVideo size={"3em"} />} />
    </SimpleGrid>
  );
}
