import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Save, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface StopRecordingModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function StopRecordingModal({
  isOpen,
  onSave,
  onDelete,
  onCancel,
}: StopRecordingModalProps) {
  const [selected, setSelected] = useState<string>("save");
  const [selectedFolder, setSelectedFolder] = useState<string>("데이터 과학");
  const folderList = ["데이터 과학", "AI 수학", "독일 문화의 이해"];

  useEffect(() => {
    if (!isOpen) {
      setSelected("save");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selected === "save") {
      onSave();
    } else if (selected === "delete") {
      onDelete();
    }
  };

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>녹음을 중지하시겠습니까?</DialogTitle>
          <DialogDescription>
            녹음을 저장하거나 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedFolder}
                <span className="ml-2">▼</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {folderList.map((folder) => (
                <DropdownMenuItem
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                >
                  {folder}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="py-4">
          <RadioGroup
            className="space-y-4"
            value={selected}
            onValueChange={setSelected}
          >
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="save" id="save" />
              <Label
                htmlFor="save"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Save className="h-5 w-5 text-blue-600" />
                <span>녹음 저장</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="delete" id="delete" />
              <Label
                htmlFor="delete"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
                <span>녹음 삭제</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            className="bg-blue-600 text-white"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
