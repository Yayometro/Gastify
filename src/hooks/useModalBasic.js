import { useCallback, useState } from "react";

export default function useModal() {
  const [close, setClose] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const handleClose = useCallback(() => {
    setClose(prev => !prev);
    setModalContent(null); 
  }, []);

  const renderModal = (content) => {
    setModalContent(content);
    setClose(prev => !prev);
  };

  return {
    close,
    modalContent,
    handleClose,
    renderModal,
  };
}
