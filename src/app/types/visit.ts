export type VisitType = string;
export type VisitStatus = string;
export type Cycle = string;

export interface VisitRecord {
  id: string;
  srNo: number;
  zone: string;
  state: string;
  siteName: string;
  siteType: string;
  ticketIds: string;
  dateOfVisit: Date;
  visitType: VisitType;
  cycle: Cycle | null;
  visitorType: string;
  vendorName: string;
  visitorName: string;
  visitorContact: string;
  rawStatus: string;
  status: VisitStatus;
  signOffReceived: boolean;
  signOffValue?: string;
  signOffNotes: string;
  visitorCharges: number;
  procurementAmount: number;
  procurementType: string;
}
