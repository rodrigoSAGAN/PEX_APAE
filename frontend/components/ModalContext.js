"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: null,
    onCancel: null,
  });

  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (modal.isOpen) {
      previousFocusRef.current = document.activeElement;

      setTimeout(() => {
        const primaryButton = modalRef.current?.querySelector('button:last-of-type');
        primaryButton?.focus();
      }, 100);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [modal.isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!modal.isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        if (modal.onCancel) {
          modal.onCancel();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modal.isOpen, modal.onCancel]);

  // Focus trap
  useEffect(() => {
    if (!modal.isOpen) return;

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [modal.isOpen]);

  const showModal = useCallback((message, title = "Aviso") => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: "alert",
        onConfirm: () => {
          closeModal();
          resolve(true);
        },
        onCancel: () => {
          closeModal();
          resolve(false);
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = "Confirmação") => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: "confirm",
        onConfirm: () => {
          closeModal();
          resolve(true);
        },
        onCancel: () => {
          closeModal();
          resolve(false);
        },
      });
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, showConfirm }}>
      {children}
      {modal.isOpen && (
        <div
          style={overlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div ref={modalRef} style={modalStyle}>
            <h3 id="modal-title" style={titleStyle}>{modal.title}</h3>
            <p style={messageStyle}>{modal.message}</p>
            <div style={actionsStyle}>
              {modal.type === "confirm" && (
                <button
                  onClick={modal.onCancel}
                  style={cancelButtonStyle}
                  aria-label="Cancelar"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={modal.onConfirm}
                style={confirmButtonStyle}
                aria-label={modal.type === "confirm" ? "Confirmar" : "OK"}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  backdropFilter: "blur(4px)",
};

const modalStyle = {
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "16px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  textAlign: "center",
  animation: "fadeIn 0.2s ease-out",
};

const titleStyle = {
  margin: "0 0 12px 0",
  fontSize: "20px",
  fontWeight: "700",
  color: "#111827",
};

const messageStyle = {
  margin: "0 0 24px 0",
  fontSize: "16px",
  color: "#4b5563",
  lineHeight: "1.5",
};

const actionsStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
};

const buttonBaseStyle = {
  padding: "10px 20px",
  borderRadius: "9999px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  border: "none",
  transition: "transform 0.1s",
};

const confirmButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: "#2563eb",
  color: "#fff",
  boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
};

const cancelButtonStyle = {
  ...buttonBaseStyle,
  backgroundColor: "#f3f4f6",
  color: "#374151",
};
