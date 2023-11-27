import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay, useDisclosure } from "@chakra-ui/react";
import { typedSxMap } from "../../../utils/typedSxMap";

export function ModalVideo({ isOpen, setClose }: any) {
  const styles = typedSxMap({
    overlay: {
      bg: "blackAlpha.300",
      backdropFilter: "blur(5px)",
    },
    modalContent: {
      minWidth: "fit-content",
      alignItems: "center",
      justifyContent: "center",
      display: "flex",
    },
  });
  const { onClose } = useDisclosure();

  const handleClose = () => {
    onClose();
    setClose();
  };

  return (
    <>
      <Modal isCentered isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay sx={styles.overlay} />
        <ModalContent sx={styles.modalContent}>
          <ModalCloseButton alignSelf="flex-end" mr={20} />
          <ModalBody>
            <iframe
              title="Tableflow getting started video"
              width="940"
              height="540"
              src="https://www.loom.com/embed/fd9e456ecead4471a167271a26554ef0?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture;"
              allowFullScreen></iframe>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
