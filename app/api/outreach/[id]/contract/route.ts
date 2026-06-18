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
    let amount = selectedAmount || "Negotiable";
    let benefits: string[] = ["Logo placement on print and digital assets", "Event banners display", "Social media mentions"];

    if (selectedTier) {
      const matchingPkg = packagesList.find(p => p.tier.toLowerCase() === selectedTier.toLowerCase());
      if (matchingPkg) {
        amount = selectedAmount || matchingPkg.amount;
        benefits = matchingPkg.benefits || benefits;
      }
    } else if (packagesList.length > 0) {
      tier = packagesList[0].tier;
      amount = packagesList[0].amount;
      benefits = packagesList[0].benefits || benefits;
    }

    // Curate tailored brand deliverables based on industry
    let industryDeliverables = "Provide prominent logo visibility on all promotional leaflets, social media handles, and backdrops.";
    if (sponsor.industry?.toLowerCase().includes("beverage")) {
      industryDeliverables = "Provide beverage stall exclusivity, physical space for red bull beverage sampling vehicles, and logo branding on main concert tickets.";
    } else if (sponsor.industry?.toLowerCase().includes("software") || sponsor.industry?.toLowerCase().includes("tech")) {
      industryDeliverables = "Provide exclusive naming rights for computer hackathons, a 15-minute presentation session for student programmers, and access to student resumes.";
    } else if (sponsor.industry?.toLowerCase().includes("sports")) {
      industryDeliverables = "Provide official logo print rights on sports team uniforms, exclusive branding on sports arena banners, and event title presentation rights.";
    }

    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Clean CSS styling for printing
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>MOU Sponsorship Agreement - ${sponsor.companyName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
          
          body {
            font-family: 'Outfit', sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 50px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          
          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #0f172a;
            margin-bottom: 5px;
          }
          
          .subtitle {
            text-align: center;
            font-size: 14px;
            color: #64748b;
            margin-bottom: 40px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          
          .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 30px;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            text-transform: uppercase;
          }
          
          p, li {
            font-size: 13.5px;
            color: #334155;
            text-align: justify;
          }
          
          .parties-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          .parties-table td {
            width: 50%;
            vertical-align: top;
            padding: 10px 15px;
            border: 1px solid #e2e8f0;
            background-color: #f8fafc;
          }
          
          .parties-title {
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            color: #475569;
            margin-bottom: 5px;
          }
          
          .list-bullets {
            padding-left: 20px;
            margin-bottom: 20px;
          }
          
          .list-bullets li {
            margin-bottom: 8px;
          }
          
          .signatures {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          
          .sig-block {
            width: 45%;
            text-align: center;
          }
          
          .sig-line {
            margin-top: 50px;
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }
          
          .sig-detail {
            font-size: 11px;
            color: #64748b;
            margin-top: 3px;
          }

          .toolbar {
            max-width: 800px;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #0f172a;
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }

          .toolbar-title {
            font-size: 14px;
            font-weight: 600;
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
            transition: background-color 0.2s;
          }

          .btn-print:hover {
            background-color: #0f766e;
          }
          
          @media print {
            body {
              padding: 0;
            }
            .container {
              border: none;
              box-shadow: none;
              padding: 0;
            }
            .toolbar {
              display: none;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <div class="toolbar-title">SponsorshipIQ MOU Contract Dashboard</div>
          <button class="btn-print" onclick="window.print()">🖨️ Print Agreement</button>
        </div>

        <div class="container">
          <h1>Memorandum of Understanding</h1>
          <div class="subtitle">SPONSORSHIP AGREEMENT</div>
          
          <p>This Memorandum of Understanding ("MOU" or "Agreement") is entered into on this <strong>${dateStr}</strong> by and between the following parties:</p>
          
          <table class="parties-table">
            <tr>
              <td>
                <div class="parties-title">The Organizer</div>
                <strong>${festProfile.college || "University Campus"}</strong><br/>
                Representing the Festival: <strong>${festProfile.name}</strong><br/>
                Location: ${festProfile.city || "India"}<br/>
                Email: ${campaign.emailAccount?.emailAddress || "sponsorship-team@sponsorshipiq.com"}
              </td>
              <td>
                <div class="parties-title">The Sponsor</div>
                <strong>${sponsor.companyName}</strong><br/>
                Representing Representative: <strong>${sponsor.contactName || "Partnership Coordinator"}</strong><br/>
                Sector: ${sponsor.industry || "General"}<br/>
                Email: ${sponsor.contactEmail}
              </td>
            </tr>
          </table>
          
          <div class="section-title">1. Purpose & Scope</div>
          <p>The purpose of this Agreement is to outline the terms, conditions, and mutual responsibilities regarding the sponsorship of the upcoming festival <strong>${festProfile.name}</strong>. The Sponsor agrees to support the festival as a **${tier}** sponsor and the Organizer agrees to deliver branding activations as detailed in this Agreement.</p>
          
          <div class="section-title">2. Financial Terms</div>
          <p>The Sponsor agrees to provide a total sponsorship amount of <strong>₹${amount}</strong> (INR) to the Organizer. This amount shall be disbursed in accordance with the following agreed schedule:</p>
          <ul class="list-bullets">
            <li>50% advance payment within seven (7) business days of signing this Agreement.</li>
            <li>50% final payment upon the successful conclusion of the festival.</li>
          </ul>
          
          <div class="section-title">3. Deliverables by Organizer</div>
          <p>In consideration of the sponsorship amount, the Organizer agrees to provide the following promotional benefits and marketing channels to the Sponsor during the festival:</p>
          <ul class="list-bullets">
            ${benefits.map(b => `<li>${b}</li>`).join("")}
            <li>${industryDeliverables}</li>
          </ul>
          
          <div class="section-title">4. Responsibilities of Sponsor</div>
          <p>The Sponsor agrees to provide high-resolution brand logos, vector promotional materials, and banner designs to the Organizer at least ten (10) days prior to the start of the festival. Any delayed assets may result in limited printing branding placement.</p>
          
          <div class="section-title">5. General Terms</div>
          <p>This Agreement is valid from the date of signing until the final transaction and reporting details are resolved. Either party may terminate this agreement with at least 15 days written notice if there is a material breach of terms.</p>
          
          <div class="signatures">
            <div class="sig-block">
              <div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc; margin-bottom: 8px; position: relative;">
                <canvas id="sigCanvasOrganizer" width="250" height="100" style="touch-action: none; cursor: crosshair; display: block; margin: 0 auto;"></canvas>
                <button onclick="clearCanvas('sigCanvasOrganizer')" style="position: absolute; bottom: 5px; right: 5px; font-size: 9px; padding: 2px 6px; background-color: #cbd5e1; border: none; border-radius: 4px; cursor: pointer;" class="no-print">Clear</button>
              </div>
              <div class="sig-line">For the Organizer</div>
              <div class="sig-detail">${festProfile.college || "University Campus"}</div>
              <div class="sig-detail">Date: _______________</div>
            </div>
            <div class="sig-block">
              <div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 10px; background-color: #f8fafc; margin-bottom: 8px; position: relative;">
                <canvas id="sigCanvasSponsor" width="250" height="100" style="touch-action: none; cursor: crosshair; display: block; margin: 0 auto;"></canvas>
                <button onclick="clearCanvas('sigCanvasSponsor')" style="position: absolute; bottom: 5px; right: 5px; font-size: 9px; padding: 2px 6px; background-color: #cbd5e1; border: none; border-radius: 4px; cursor: pointer;" class="no-print">Clear</button>
              </div>
              <div class="sig-line">For the Sponsor</div>
              <div class="sig-detail">${sponsor.companyName}</div>
              <div class="sig-detail">Date: _______________</div>
            </div>
          </div>
        </div>

        <script>
          function initCanvas(id) {
            const canvas = document.getElementById(id);
            const ctx = canvas.getContext('2d');
            let drawing = false;

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            function getMousePos(e) {
              const rect = canvas.getBoundingClientRect();
              const clientX = e.touches ? e.touches[0].clientX : e.clientX;
              const clientY = e.touches ? e.touches[0].clientY : e.clientY;
              return {
                x: clientX - rect.left,
                y: clientY - rect.top
              };
            }

            function startDraw(e) {
              drawing = true;
              const pos = getMousePos(e);
              ctx.beginPath();
              ctx.moveTo(pos.x, pos.y);
              e.preventDefault();
            }

            function draw(e) {
              if (!drawing) return;
              const pos = getMousePos(e);
              ctx.lineTo(pos.x, pos.y);
              ctx.stroke();
              e.preventDefault();
            }

            function endDraw(e) {
              drawing = false;
              e.preventDefault();
            }

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', endDraw);
            canvas.addEventListener('mouseleave', endDraw);

            canvas.addEventListener('touchstart', startDraw);
            canvas.addEventListener('touchmove', draw);
            canvas.addEventListener('touchend', endDraw);
          }

          function clearCanvas(id) {
            const canvas = document.getElementById(id);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          window.onload = function() {
            initCanvas('sigCanvasOrganizer');
            initCanvas('sigCanvasSponsor');
          };
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (err) {
    console.error("[Contract Generate API Route Error]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
