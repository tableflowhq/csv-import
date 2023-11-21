import { IconType } from "react-icons";
import { useNavigate } from "react-router";
import { Flex, Icon, Link, Menu, MenuButton, Text } from "@chakra-ui/react";
import { typedSxMap } from "../../../utils/typedSxMap";

interface NavItemProps {
  icon: IconType;
  title: string;
  name: string;
  navSize: string;
  url?: string;
  isSelected?: boolean;
  isExtarnalLink?: boolean;
  onClick?: () => void;
}

export default function NavItem({ icon, title, name, navSize, url, isSelected, isExtarnalLink }: NavItemProps) {
  const navigate = useNavigate();
  const styles = typedSxMap({
    container: {
      flexDir: "column",
      w: "100%",
      alignItems: navSize === "small" ? "center" : "flex-start",
      justifyContent: "center",
    },
    link: {
      backgroundColor: isSelected && "var(--color-secondary-hover)",
      p: 2,
      borderRadius: 10,
      w: navSize === "large" ? "100%" : undefined,
    },
    icon: {
      fontSize: "xl",
      color: isSelected ? "#82AAAD" : "gray.500",
    },
  });
  return (
    <Flex sx={styles.container}>
      <Menu placement="right">
        <Link
          sx={styles.link}
          _hover={{ textDecor: "none", backgroundColor: "var(--color-secondary-hover)" }}
          onClick={() => {
            if (url && !isExtarnalLink) {
              navigate(url);
            } else {
              window.open(url, "_blank");
            }
          }}>
          <MenuButton w="100%">
            <Flex>
              <Icon sx={styles.icon} as={icon} />
              <Text ml={2} display={navSize === "small" ? "none" : "flex"}>
                {title}
              </Text>
            </Flex>
          </MenuButton>
        </Link>
      </Menu>
    </Flex>
  );
}
