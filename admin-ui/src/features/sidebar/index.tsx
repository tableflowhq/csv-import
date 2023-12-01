import { useContext, useEffect, useState } from "react";
import { IconType } from "react-icons";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import { Box, BoxProps, Divider, Drawer, DrawerContent, Flex, IconButton, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import Tableflow from "../../components/Tableflow";
import ThemeToggle from "../../components/ThemeToggle";
import { AuthContext } from "../../providers/Auth";
import useLocalStorage from "../../hooks/useLocalStorage";
import { typedSxMap } from "../../utils/typedSxMap";
import NavItem from "./components/NavItem";
import { FiChevronsLeft, FiChevronsRight, FiHome } from "react-icons/fi";
import { PiCube, PiFiles, PiGear, PiQuestion, PiSignOut, PiWallet } from "react-icons/pi";

interface LinkItemProps {
  name: string;
  label: string;
  icon: IconType;
  url: string;
}
const LinkItems: Array<LinkItemProps> = [
  { name: "importers", label: "Importers", icon: PiCube, url: "/importers" },
  { name: "data", label: "Data", icon: PiFiles, url: "/data" },
];

export default function Sidebar() {
  const { isOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
      <SidebarContent onClose={() => onClose} display={{ base: "none", md: "block" }} />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} returnFocusOnClose={false} onOverlayClick={onClose} size="full">
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
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
    avatar: {
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      width: 4,
      height: 4,
    },
  });
  return (
    <Flex sx={styles.container} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <Flex sx={styles.topMenuContainer} as="nav">
        <Flex alignItems="center" mx="2" mb={5}>
          <Link to="/">
            <Tableflow color size="small" short={isCollapsed} />
          </Link>
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

        {sessionExists && showProfile && (
          <NavItem
            navSize={navSize}
            icon={FiHome}
            title="Getting started"
            name="getting"
            url="/getting-started"
            isSelected={urlPage.includes("getting")}
          />
        )}

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
          <ThemeToggle small={isCollapsed} />
        </Box>

        {sessionExists && verified && (
          <>
            <NavItem navSize={navSize} icon={PiQuestion} title="Docs" name="docs" url="https://tableflow.com/docs" isExternalLink />
            <NavItem navSize={navSize} icon={PiGear} title="Settings" name="settings" url="/settings" isSelected={urlPage.includes("settings")} />
          </>
        )}

        {sessionExists && showProfile && (
          <>
            <NavItem navSize={navSize} icon={PiWallet} title="Billing" name="billing" url="/billing" isSelected={urlPage.includes("billing")} />
            <NavItem navSize={navSize} icon={PiSignOut} title="Logout" name="logout" onClick={() => onLogout()} />
          </>
        )}
      </Flex>
    </Flex>
  );
};
