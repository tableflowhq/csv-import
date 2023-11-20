import {
    Flex,
    Text,
    Icon,
    Link,
    Menu,
    MenuButton,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router';

export default function NavItem({ icon, title, description, active, navSize, url }: any) {
    const navigate = useNavigate();
    return (
        <Flex
            flexDir="column"
            w="100%"
            alignItems={navSize === "small" ? "center" : "flex-start"}
            justifyContent={"center"}
        >
            <Menu placement="right">
                <Link
                    backgroundColor={active && "var(--color-secondary-hover)"}
                    p={2}
                    borderRadius={10}
                    _hover={{ textDecor: 'none', backgroundColor: "var(--color-secondary-hover)" }}
                    w={navSize === "large" ? "100%" : undefined} 
                    onClick={() => navigate(url)}
                >
                    <MenuButton w="100%">
                        <Flex>
                            <Icon as={icon} fontSize="xl" color={active ? "#82AAAD" : "gray.500"} />
                            <Text ml={2} display={navSize === "small" ? "none" : "flex"}>{title}</Text>
                        </Flex>
                    </MenuButton>
                </Link>
            </Menu>
        </Flex>
    )
}