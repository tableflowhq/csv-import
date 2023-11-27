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
  isExternalLink?: boolean;
  onClick?: () => void;
}

export default function NavItem({ icon, title, name, navSize, url, isSelected, isExternalLink, onClick }: NavItemProps) {
  const navigate = useNavigate();
  const styles = typedSxMap({
    container: {
      flexDir: "column",
      w: "100%",
      alignItems: navSize === "small" ? "center" : "flex-start",
      justifyContent: "center",
    },
    link: {
      backgroundColor: isSelected ? "var(--color-secondary-hover)" : undefined,
      color: isSelected ? "var(--color-button-hover)" : undefined,
      p: 2,
      borderRadius: 10,
      w: navSize === "large" ? "100%" : undefined,
      display: "flex",
      transition: "all 0.2s ease-in-out 0s",
      _hover: {
        textDecor: "none",
        backgroundColor: "var(--color-secondary-hover)",
        color: "var(--color-button-hover)",
      },
    },
    icon: {
      fontSize: "xl",
    },
  });
  return (
    <Flex sx={styles.container}>
      <Menu placement="right">
        <Link
          sx={styles.link}
          onClick={() => {
            if (onClick) {
              onClick();
            } else {
              if (url) {
                if (!isExternalLink) {
                  navigate(url);
                } else {
                  window.open(url, "_blank");
                }
              }
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
