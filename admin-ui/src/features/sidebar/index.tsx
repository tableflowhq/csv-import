import { useContext, useEffect, useState } from "react";
import { IconType } from "react-icons";
import { useLocation } from "react-router";
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
import useLocalStorage from "../../hooks/useLocalStorage";
import { typedSxMap } from "../../utils/typedSxMap";
import NavItem from "./components/NavItem";
import { FiChevronsLeft, FiChevronsRight, FiCompass, FiDatabase, FiHelpCircle, FiHome, FiMenu, FiSettings, FiTrendingUp } from "react-icons/fi";

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
];

export default function Sidebar() {
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
  const [storagedNavSize, setStoragedNavSize] = useLocalStorage("navSize", "large");
  const [navSize, setNavSize] = useState(storagedNavSize);
  const sessionContext = useContext(AuthContext);
  const { sessionExists, verified, showProfile, signOut } = sessionContext;
  const location = useLocation();
  const urlPage = location.pathname?.substring(1);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setStoragedNavSize(navSize);
  }, [navSize]);

  const changeNavSize = (newSize: string) => {
    setNavSize(newSize);
  };

  async function onLogout() {
    signOut && signOut();
  }

  const isCollapsed = navSize === "small";

  const styles = typedSxMap({
    container: {
      position: "sticky",
      left: "5",
      h: "100vh",
      w: isCollapsed ? "75px" : "250px",
      flexDir: "column",
      justifyContent: "space-between",
      transition: "width 0.3s ease",
    },
    topMenuContainer: {
      mt: 2,
      p: "2",
      flexDir: "column",
      w: "100%",
      alignItems: isCollapsed ? "center" : "flex-start",
    },
    bottomMenuContainer: {
      p: "5%",
      flexDir: "column",
      w: "100%",
      alignItems: isCollapsed ? "center" : "flex-start",
      mb: 2,
    },
    divider: {
      mt: 4,
      mb: 2,
      borderColor: "var(--color-border)",
      borderBottomWidth: "1px",
      borderStyle: "solid",
    },
    themeToggleBox: {
      margin: "2",
    },
    toggleNavSize: {
      fontSize: "xl",
      position: "absolute",
      left: isCollapsed ? "50%" : undefined,
      transform: isCollapsed ? "translateX(-50%)" : undefined,
      right: isCollapsed ? "" : "2",
      opacity: isCollapsed ? (isHovering && "1") || "0" : "1",
      padding: "2",
      transition: "opacity 0.3s ease 0s",
      borderRadius: "10",
      backgroundColor: isCollapsed ? "var(--color-border)" : undefined,
      _hover: {
        backgroundColor: !isCollapsed ? "var(--color-border)" : undefined,
      },
    },
  });
  return (
    <Flex sx={styles.container} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <Flex sx={styles.topMenuContainer} as="nav">
        <Flex alignItems="center" mx="2" mb={5}>
          <Tableflow color size="small" short={isCollapsed} />
          <IconButton
            className="toggle-nav-size"
            sx={styles.toggleNavSize}
            background="none"
            aria-label="toggle navigation"
            icon={isCollapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            onClick={() => {
              if (isCollapsed) changeNavSize("large");
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
            isSelected={urlPage.includes(link.name.toLowerCase())}
          />
        ))}
      </Flex>

      <Flex sx={styles.bottomMenuContainer}>
        <Divider sx={styles.divider} />
        <Box sx={styles.themeToggleBox}>
          <ThemeToggle />
        </Box>

        {sessionExists && verified && (
          <>
            <NavItem navSize={navSize} icon={FiHelpCircle} title="Docs" name="docs" url="https://tableflow.com/docs" isExternalLink />
            <NavItem
              navSize={navSize}
              icon={FiSettings}
              title="Settings"
              name="settings"
              url="/settings"
              isSelected={urlPage.includes("settings")}
            />
          </>
        )}

        {sessionExists && showProfile && (
          <>
            <NavItem navSize={navSize} icon={FiDatabase} title="Billing" name="billing" url="/billing" isSelected={"billing" === urlPage} />
            <Flex mt={2} align="center">
              <Avatar size="sm" borderRadius={"full"} alignItems={"center"} justifyContent={"center"} textAlign={"center"} width={4} height={4} />
              <Flex flexDir="column" ml={4} display={navSize === "small" ? "none" : "flex"}>
                <Heading as="h3" size="sm">
                  User Test
                </Heading>
                <Text color="gray">User Role Test</Text>
              </Flex>
            </Flex>
            <NavItem navSize={navSize} icon={FiDatabase} title="Logout" name="logout" onClick={() => onLogout()} />
          </>
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
