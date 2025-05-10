import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  message,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{message}</DialogTitle>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            아니오
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            네
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
