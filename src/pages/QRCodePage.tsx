import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function QRCodePage() {
  const [copied, setCopied] = useState(false);
  const registerUrl = `${window.location.origin}/register`;

  const handleCopy = () => {
    navigator.clipboard.writeText(registerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">QR Code ลงทะเบียนลูกค้า</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">สแกนเพื่อเปิดฟอร์มลงทะเบียน</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={registerUrl} size={240} level="H" includeMargin />
          </div>
          <div className="flex items-center gap-2 w-full">
            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{registerUrl}</code>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            แชร์ QR Code หรือลิงก์นี้ให้ลูกค้าเพื่อกรอกข้อมูลลงทะเบียน
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
