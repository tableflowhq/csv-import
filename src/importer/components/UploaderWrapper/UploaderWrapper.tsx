import { useState } from "react";
import { UploaderWrapperProps } from "./types";
import { useDropzone } from "react-dropzone";
import { Box, Text } from "@chakra-ui/react";
import { Button } from "@chakra-ui/button";
import { PiArrowCounterClockwise, PiFile } from "react-icons/pi";
import useThemeStore from "../../stores/theme";

export default function UploaderWrapper({ onSuccess, setDataError, ...props }: UploaderWrapperProps) {
  const [loading, setLoading] = useState(false);
  const theme = useThemeStore((state) => state.theme);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    maxFiles: 1,
    // maxSize: 1 * Math.pow(1024, 3),
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    onDropRejected: (fileRejections) => {
      setLoading(false);
      // const errorMessage = fileRejections.map((fileRejection) => fileRejection.errors[0].message).join(", ");
      const errorMessage = fileRejections[0].errors[0].message;
      setDataError(errorMessage);
    },
    onDropAccepted: async ([file]) => {
      setLoading(true);
      onSuccess(file);
      setLoading(false);
    },
  });

  return (
    <Box
      padding="15px"
      border="1px solid var(--color-border)"
      borderRadius="var(--border-radius-2)"
    >
      <Box 
        {...getRootProps()} 
        width="100%" 
        height="100%"
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        flexDirection="column" 
        flex={1}
        border="2px dashed var(--color-border)"
        borderRadius="var(--border-radius-2)"
      >
        <input {...getInputProps()}/>
        {isDragActive ? (
          <Text>Drop your file here</Text>
        ) : loading ? (
          <Text>Loading...</Text>
        ) : (
          <>
            <Text>Drop your file here</Text>
            <Text>or</Text>
            <Button 
              leftIcon={<PiFile />} 
              onClick={open} 
              mt="6px" 
              colorScheme={"secondary"} 
              variant={theme === "light" ? "outline" : "solid"}
              _hover={theme === "light" ? {
                background: "var(--color-border)",
                color: "var(--color-text)"
              } : undefined}
            >
              Browse files
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
