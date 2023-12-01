import { useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { Box, Container, Flex, Heading, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import Button from "../../components/Button";
import { AuthContext } from "../../providers/Auth";
import { typedSxMap } from "../../utils/typedSxMap";
import WelcomeBoxes from "./components/WelcomeBoxes";

export default function Welcome() {
  const navigate = useNavigate();
  const sessionContext = useContext(AuthContext);
  const { showProfile } = sessionContext;

  useEffect(() => {
    if (!showProfile) {
      navigate("/importers");
    }
  }, [showProfile, navigate]);

  const styles = typedSxMap({
    container: {
      maxW: "7xl",
      margin: "0 auto",
      pb: 5,
      mt: 8,
    },
    stackWrapper: {
      gap: 6,
      py: 3,
      paddingBottom: 3,
    },
  });
  return (
    <Container sx={styles.container}>
      <Heading lineHeight={1.1} fontWeight={600} fontSize={{ base: "2xl", sm: "4xl", lg: "5xl" }}>
        <Text as={"span"} position={"relative"}>
          Welcome to Tableflow
        </Text>
      </Heading>
      <Stack sx={styles.stackWrapper} align={"center"} direction={{ base: "column", md: "row" }} justifyContent={"space-between"}>
        <Flex justify={"center"} align={"center"} position={"relative"} w={"100%"} maxW={"800px"}>
          <Box position={"relative"} height={"450px"} minWidth={800} rounded={"2xl"} boxShadow={"2xl"} width={"full"} overflow={"hidden"}>
            <iframe
              title="Tableflow getting started video"
              width="800"
              height="450"
              src="https://www.loom.com/embed/fd9e456ecead4471a167271a26554ef0?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture;"
              allowFullScreen></iframe>
          </Box>
        </Flex>
        <Box maxW="7xl">
          <WelcomeBoxes />
        </Box>
      </Stack>
      <Stack
        flexDirection={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        flex={1}
        p={4}
        mt={10}
        shadow={"xl"}
        border={"1px solid"}
        borderColor={useColorModeValue("gray.800", "gray.500")}
        borderRadius={10}>
        <Text fontSize={"xl"} mb={"0 !important"}>
          Checkout an example import experience{" "}
        </Text>
        <Button variants={["primary"]}>Try out our Importer Demo</Button>
      </Stack>
    </Container>
  );
}
