import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PaymentResultPage = () => {
  const [params] = useSearchParams();
  const status = params.get("status");
  const quotationId = params.get("quotation_id");

  const isSuccess = status === "success";
  const isPending = status === "pending";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{
          background: isSuccess ? '#dcfce7' : isPending ? '#fef9c3' : '#fee2e2',
        }}>
          {isSuccess ? (
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          ) : isPending ? (
            <Clock className="h-10 w-10 text-yellow-600" />
          ) : (
            <XCircle className="h-10 w-10 text-red-600" />
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold">
          {isSuccess ? "ชำระเงินสำเร็จ" : isPending ? "รอดำเนินการ" : "ชำระเงินไม่สำเร็จ"}
        </h1>

        <p className="mb-6 text-muted-foreground">
          {isSuccess
            ? "ขอบคุณสำหรับการชำระเงิน ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว"
            : isPending
              ? "การชำระเงินอยู่ระหว่างดำเนินการ กรุณารอสักครู่"
              : "การชำระเงินไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อเจ้าหน้าที่"}
        </p>

        {quotationId && (
          <p className="mb-6 text-sm text-muted-foreground">
            รหัสอ้างอิง: <span className="font-mono font-medium">{quotationId.slice(0, 8)}</span>
          </p>
        )}

        <div className="flex flex-col gap-2">
          {!isSuccess && (
            <Button variant="default" onClick={() => window.history.back()}>
              ลองอีกครั้ง
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href="/">กลับหน้าหลัก</a>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Powered by Optima Medical
        </p>
      </Card>
    </div>
  );
};

export default PaymentResultPage;
