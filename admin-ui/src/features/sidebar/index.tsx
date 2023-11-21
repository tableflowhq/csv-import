import { ReactText, useContext, useEffect, useState } from "react";
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
import ThemeToggle from "../../components/ThemeToggle";
import { AuthContext } from "../../providers/Auth";
import { typedSxMap } from "../../utils/typedSxMap";
import NavItem from "./components/NavItem";
import { FiCompass, FiDatabase, FiHome, FiMenu, FiSettings, FiTrendingUp } from "react-icons/fi";

interface LinkItemProps {
  name: string;
  label: string;
  icon: IconType;
  url: string;
}
const LinkItems: Array<LinkItemProps> = [
  { name: "getting", label: "Getting started", icon: FiHome, url: "/importers" },
  { name: "importers", label: "Importers", icon: FiTrendingUp, url: "/importers" },
  { name: "data", label: "Data", icon: FiCompass, url: "/data" },
  { name: "settings", label: "Settings", icon: FiSettings, url: "/settings" },
];

export default function Sidebar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPage, setSelectedPage] = useState("");

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent onClose={() => onClose} selectedPage={selectedPage} onSelectPage={setSelectedPage} display={{ base: "none", md: "block" }} />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose} size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} selectedPage={selectedPage} onSelectPage={setSelectedPage} />
        </DrawerContent>
      </Drawer>
      <MobileNav display={{ base: "flex", md: "none" }} onOpen={onOpen} />
    </Box>
  );
}

interface SidebarProps extends BoxProps {
  onClose: () => void;
  selectedPage: string;
  onSelectPage: any;
}

const SidebarContent = ({ onClose, selectedPage, onSelectPage, ...rest }: SidebarProps) => {
  const [navSize, changeNavSize] = useState("large");
  const sessionContext = useContext(AuthContext);
  const { sessionExists, verified, showProfile, signOut } = sessionContext;

  async function onLogout() {
    signOut && signOut();
  }

  const styles = typedSxMap({
    container: {
      position: "sticky",
      left: "5",
      h: "100vh",
      //   marginTop: "2.5vh",
      w: navSize === "small" ? "75px" : "250px",
      flexDir: "column",
      justifyContent: "space-between",
      transition: "width 0.3s ease",
    },
    topMenuContainer: {
      mt: 2,
      p: "5%",
      flexDir: "column",
      w: "100%",
      alignItems: navSize === "small" ? "center" : "flex-start",
    },
    bottomMenuContainer: {
      p: "5%",
      flexDir: "column",
      w: "100%",
      alignItems: navSize === "small" ? "center" : "flex-start",
      mb: 2,
    },
    divider: {
      mt: 4,
      mb: 2,
      borderColor: "var(--color-border)",
      borderBottomWidth: "1px",
      borderStyle: "solid",
    },
  });
  return (
    <Flex sx={styles.container}>
      <Flex sx={styles.topMenuContainer} as="nav">
        <Flex alignItems="center" mx="2" mb={5}>
          <Tableflow color size="small" short={navSize === "small"} />
          <IconButton
            background="none"
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
          <NavItem
            key={link.name}
            navSize={navSize}
            icon={link.icon}
            title={link.label}
            url={link.url}
            name={link.name}
            isSelected={selectedPage === link.name}
            onSelect={() => onSelectPage(link.name)}
          />
        ))}
      </Flex>

      <Flex sx={styles.bottomMenuContainer}>
        <Divider sx={styles.divider} />
        <ThemeToggle />
        <NavItem navSize={navSize} icon={FiSettings} title="Settings" url="/settings" onSelect={() => onSelectPage("setting")} />
        {sessionExists && showProfile && (
          <NavItem navSize={navSize} icon={FiDatabase} title="Billing" url="/billing" onSelect={() => onSelectPage("billing")} />
        )}
        {sessionExists && showProfile && (
          <Flex mt={2} align="center">
            <Avatar size="sm" borderRadius={"full"} alignItems={"center"} justifyContent={"center"} textAlign={"center"} width={4} height={4} />
            <Flex flexDir="column" ml={4} display={navSize === "small" ? "none" : "flex"}>
              <Heading as="h3" size="sm">
                User Test
              </Heading>
              <Text color="gray">User Role Test</Text>
            </Flex>
          </Flex>
        )}
        {sessionExists && showProfile && (
          <NavItem navSize={navSize} icon={FiDatabase} title="Billing" onClick={() => onLogout()} onSelect={() => onSelectPage("logout")} />
        )}
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
