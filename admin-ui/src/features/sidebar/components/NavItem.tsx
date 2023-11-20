import {
    Flex,
    Text,
    Icon,
    Link,
    Menu,
    MenuButton,
} from '@chakra-ui/react'

export default function NavItem({ icon, title, description, active, navSize }: any) {
    return (
        <Flex
            flexDir="column"
            w="100%"
            alignItems={navSize === "small" ? "center" : "flex-start"}
        >
            <Menu placement="right">
                <Link
                    backgroundColor={active && "var(--color-secondary-hover)"}
                    p={3}
                    borderRadius={10}
                    _hover={{ textDecor: 'none', backgroundColor: "var(--color-secondary-hover)" }}
                    w={navSize === "large" ? "100%" : undefined} 
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