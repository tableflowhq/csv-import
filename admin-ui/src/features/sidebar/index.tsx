import { ReactText, useEffect, useState } from "react";
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
import { FiCompass, FiHome, FiMenu, FiSettings, FiTrendingUp, FiCalendar } from "react-icons/fi";
import { typedSxMap } from "../../utils/typedSxMap";

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
  onSelectPage: any
}

const SidebarContent = ({ onClose, selectedPage, onSelectPage, ...rest }: SidebarProps) => {
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
      transition: "width 0.3s ease"
    },
    topMenuContainer: {
      p:"5%", 
      flexDir:"column", 
      w:"100%",
      alignItems: navSize === "small" ? "center" : "flex-start"
    },
    bottomMenuContainer: {
      p:"5%",
      flexDir:"column",
      w:"100%",
      alignItems: navSize === "small" ? "center" : "flex-start",
      mb:4
    }
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
      <Divider mt={4} mb={2} borderColor="white" />
        <Divider display={navSize === "small" ? "none" : "flex"} borderColor="white" />
        <NavItem navSize={navSize} icon={FiSettings} title="Settings" />
        <NavItem navSize={navSize} icon={FiCalendar} title="Calendar" />
        <NavItem navSize={navSize} icon={FiCalendar} title="Calendar" />
        {/* <Flex mt={2} align="center">
          <Avatar size="sm" />
          <Flex flexDir="column" ml={4} display={navSize === "small" ? "none" : "flex"}>
            <Heading as="h3" size="sm">
              User Test
            </Heading>
            <Text color="gray">User Role Test</Text>
          </Flex>
        </Flex> */}
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
