import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id } = await params;
    const url = new URL(req.url);
    const selectedTier = url.searchParams.get("tier");
    const selectedAmount = url.searchParams.get("amount");

    const outreach = await db.outreach.findUnique({
      where: { id },
      include: {
        sponsor: true,
        campaign: {
          include: {
            festProfile: true,
            emailAccount: true,
          },
        },
      },
    });

    if (!outreach || outreach.campaign.userId !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { campaign, sponsor } = outreach;
    const { festProfile } = campaign;

    // Parse packages list
    let packagesList: any[] = [];
    if (festProfile.packages) {
      try {
        packagesList = JSON.parse(festProfile.packages);
      } catch {
        packagesList = [{ tier: "Sponsor Partner", amount: "Negotiable", benefits: ["Logo visibility", "Stall space"] }];
      }
    }

    // Determine target tier & amount
    let tier = selectedTier || "Sponsorship Partner";
    let amountStr = selectedAmount || "Negotiable";
    if (!selectedTier && packagesList.length > 0) {
      tier = packagesList[0].tier;
      amountStr = packagesList[0].amount;
    }

    // Parse amount to number for GST calculation
    const amountVal = parseFloat(amountStr.replace(/,/g, "")) || 0;
    const gstRate = 0.18; // 18% GST
    const gstAmount = amountVal * gstRate;
    const totalAmount = amountVal + gstAmount;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${id.slice(-4).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Sponsorship Invoice - ${invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            color: #1f2937;
            background-color: #ffffff;
            line-height: 1.5;
            margin: 0;
            padding: 40px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            padding: 40px;
            border-radius: 12px;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 30px;
            margin-bottom: 30px;
          }
          
          .logo-text {
            font-size: 20px;
            font-weight: 700;
            color: #0d9488;
            letter-spacing: -0.5px;
          }
          
          .company-details {
            text-align: right;
            font-size: 12px;
            color: #4b5563;
          }
          
          .invoice-title {
            font-size: 24px;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .bill-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 13px;
          }
          
          .bill-to, .invoice-info {
            width: 45%;
          }
          
          .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #9ca3af;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .table th {
            background-color: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #4b5563;
          }
          
          .table td {
            border-bottom: 1px solid #f3f4f6;
            padding: 12px;
            font-size: 13px;
            color: #374151;
          }
          
          .totals {
            margin-left: auto;
            width: 40%;
            font-size: 13px;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          
          .totals-row.final {
            border-bottom: none;
            font-weight: 700;
            font-size: 15px;
            color: #0d9488;
            padding-top: 10px;
          }

          .toolbar {
            max-width: 800px;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #111827;
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 8px;
          }

          .btn-print {
            background-color: #0d9488;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }
          
          @media print {
            body {
              padding: 0;
            }
            .container {
              border: none;
              padding: 0;
            }
            .toolbar {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <span style="font-size: 12px; font-weight: 600;">SponsorshipIQ Invoice Portal</span>
          <button class="btn-print" onclick="window.print()">🖨️ Print Invoice / PDF</button>
        </div>

        <div class="container">
          <div class="header">
            <div>
              <div class="logo-text">SponsorshipIQ</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Campus Sponsorship Coordinator Hub</div>
            </div>
            <div class="company-details">
              <strong>${festProfile.college || "University Campus"}</strong><br/>
              Sponsorship Department, ${festProfile.name}<br/>
              ${festProfile.city || "India"}<br/>
              Email: ${campaign.emailAccount?.emailAddress || "sponsorship-team@sponsorshipiq.com"}
            </div>
          </div>
          
          <div class="bill-section">
            <div class="bill-to">
              <div class="section-title">Bill To</div>
              <strong>${sponsor.companyName}</strong><br/>
              Attn: ${sponsor.contactName || "Partnerships Head"}<br/>
              ${sponsor.contactEmail}<br/>
              Sector: ${sponsor.industry || "General"}
            </div>
            
            <div class="invoice-info">
              <div class="section-title">Invoice Details</div>
              <div class="invoice-title">${invoiceNumber}</div>
              <div style="margin-top: 5px;">
                Date: <strong>${dateStr}</strong><br/>
                Due Date: <strong>Immediate</strong><br/>
                Payment Status: <strong>Pending Review</strong>
              </div>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${tier} sponsorship package</strong> for the event <strong>${festProfile.name}</strong>.<br/>
                  <span style="font-size: 11px; color: #6b7280;">Includes general brand presence, naming rights alignment, and stall space configurations.</span>
                </td>
                <td style="text-align: right; font-weight: 600;">₹${amountVal.toLocaleString("en-IN") || amountStr}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>₹${amountVal.toLocaleString("en-IN")}</span>
            </div>
            <div class="totals-row">
              <span>GST (18%)</span>
              <span>₹${gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div class="totals-row final">
              <span>Total due</span>
              <span>₹${totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div style="margin-top: 60px; border-top: 1px solid #f3f4f6; padding-top: 20px; font-size: 11px; color: #9ca3af; text-align: center;">
            Thank you for sponsoring ${festProfile.name}! This invoice is compiled digitally through SponsorshipIQ.
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (err) {
    console.error("[Invoice Generate API Route Error]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
