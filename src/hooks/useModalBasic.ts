import { useCallback, useState } from "react";
import type React from "react";

export interface UseModalReturn {
  close: boolean;
  modalContent: React.ReactNode;
  handleClose: () => void;
  renderModal: (content?: React.ReactNode) => void;
}

export default function useModal(): UseModalReturn {
  const [close, setClose] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const handleClose = useCallback(() => {
    setClose((prev) => !prev);
    setModalContent(null);
  }, []);

  const renderModal = (content?: React.ReactNode) => {
    setModalContent(content);
    setClose((prev) => !prev);
  };

  return {
    close,
    modalContent,
    handleClose,
    renderModal,
  };
}
