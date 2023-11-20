import { ReactText, useState } from "react";
import { IconType } from "react-icons";
import {
  Avatar,
  Box,
  BoxProps,
  Divider,
  Drawer,
  DrawerContent,
  Flex,
  FlexProps,
  Heading,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import Tableflow from "../../components/Tableflow";
import NavItem from "./components/NavItem";
import { FiCompass, FiHome, FiMenu, FiSettings, FiTrendingUp } from "react-icons/fi";
import { typedSxMap } from "../../utils/typedSxMap";

interface LinkItemProps {
  name: string;
  icon: IconType;
  url: string;
}
const LinkItems: Array<LinkItemProps> = [
  { name: "Getting started", icon: FiHome, url: "/" },
  { name: "Importers", icon: FiTrendingUp, url: "/importers" },
  { name: "Data", icon: FiCompass, url: "/data" },
  { name: "Settings", icon: FiSettings, url: "/settings" },
];

export default function SimpleSidebar() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent onClose={() => onClose} display={{ base: "none", md: "block" }} />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose} size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} />
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const [navSize, changeNavSize] = useState("large");
  const styles = typedSxMap({
    container: {
      position: "sticky",
      left: "5",
      h: "100vh",
      marginTop: "2.5vh",
      w: navSize === "small" ? "75px" : "250px",
      flexDir: "column",
      justifyContent: "space-between",
    }
  });
  return (
    <Flex sx={styles.container}>
      <Flex p="5%" flexDir="column" w="100%" alignItems={navSize === "small" ? "center" : "flex-start"} as="nav">
        <Flex h="10" alignItems="center" mx="2">
          <Tableflow color />
          <IconButton
            background="none"
            mt={5}
            _hover={{ background: "none" }}
            aria-label="toggle navigation"
            icon={<FiMenu />}
            onClick={() => {
              if (navSize === "small") changeNavSize("large");
              else changeNavSize("small");
            }}
          />
        </Flex>
        {LinkItems.map((link) => (
          <NavItem navSize={navSize} icon={link.icon} title={link.name} description="This is the description for the test." />
        ))}
      </Flex>

      <Flex p="5%" flexDir="column" w="100%" alignItems={navSize === "small" ? "center" : "flex-start"} mb={4}>
        <Divider display={navSize === "small" ? "none" : "flex"} borderColor="white" />
        <Flex mt={4} align="center">
          <Avatar size="sm" />
          <Flex flexDir="column" ml={4} display={navSize === "small" ? "none" : "flex"}>
            <Heading as="h3" size="sm">
              User Test
            </Heading>
            <Text color="gray">User Role Test</Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

interface MobileProps extends FlexProps {
  onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 24 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("white", "gray.900")}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent="flex-start"
      {...rest}>
      <IconButton variant="outline" onClick={onOpen} aria-label="open menu" icon={<FiMenu />} />

      <Tableflow color />
    </Flex>
  );
};
