using System;
using System.Net;
using System.Threading.Tasks;
using System.Web.Mvc;
using Frapid.ApplicationState.Cache;
using Frapid.Areas.CSRF;
using Frapid.Dashboard;
using MixERP.Sales.DAL.Backend.Tasks;
using MixERP.Sales.DTO;
using MixERP.Sales.QueryModels;
using Frapid.DataAccess.Models;

namespace MixERP.Sales.Controllers.Backend.Tasks
{
    [AntiForgery]
    public class QuotationController : SalesDashboardController
    {
        [Route("dashboard/sales/tasks/quotation/checklist/{tranId}")]
        [MenuPolicy(OverridePath = "/dashboard/sales/tasks/quotation")]
        [AccessPolicy("sales", "quotations", AccessTypeEnum.Read)]
        public ActionResult CheckList(long tranId)
        {
            return this.FrapidView(this.GetRazorView<AreaRegistration>("Tasks/Quotation/CheckList.cshtml", this.Tenant), tranId);
        }

        [Route("dashboard/sales/tasks/quotation/merge-model/{quotationId}")]
        [AccessPolicy("sales", "quotation_details", AccessTypeEnum.Read)]
        public async Task<ActionResult> GetMergeModelAsync(long quotationId)
        {
            var model = await Quotations.GetMergeModelAsync(this.Tenant, quotationId).ConfigureAwait(true);
            return this.Ok(model);
        }

        [Route("dashboard/sales/tasks/quotation/view")]
        [MenuPolicy(OverridePath = "/dashboard/sales/tasks/quotation")]
        [AccessPolicy("sales", "quotations", AccessTypeEnum.Read)]
        public async Task<ActionResult> ViewAsync(QuotationQueryModel query)
        {
            try
            {
                var meta = await AppUsers.GetCurrentAsync().ConfigureAwait(false);

                query.UserId = meta.UserId;
                query.OfficeId = meta.OfficeId;

                var model = await Quotations.GetQuotationResultViewAsync(this.Tenant, query).ConfigureAwait(true);
                return this.Ok(model);
            }
            catch (Exception ex)
            {
                return this.Failed(ex.Message, HttpStatusCode.InternalServerError);
            }
        }

        [Route("dashboard/sales/tasks/quotation")]
        [MenuPolicy]
        [AccessPolicy("sales", "quotations", AccessTypeEnum.Read)]
        public ActionResult Index()
        {
            return this.FrapidView(this.GetRazorView<AreaRegistration>("Tasks/Quotation/Index.cshtml", this.Tenant));
        }

        [Route("dashboard/sales/tasks/quotation/verification")]
        [MenuPolicy]
        [AccessPolicy("sales", "quotations", AccessTypeEnum.Verify)]
        public ActionResult Verification()
        {
            return this.FrapidView(this.GetRazorView<AreaRegistration>("Tasks/Quotation/Verification.cshtml", this.Tenant));
        }

        [Route("dashboard/sales/tasks/quotation/new")]
        [MenuPolicy(OverridePath = "/dashboard/sales/tasks/quotation")]
        [AccessPolicy("sales", "quotations", AccessTypeEnum.Read)]
        public ActionResult New()
        {
            return this.FrapidView(this.GetRazorView<AreaRegistration>("Tasks/Quotation/New.cshtml", this.Tenant));
        }

        [Route("dashboard/sales/tasks/quotation/new")]
        [HttpPost]
        [AccessPolicy("sales", "quotations", AccessTypeEnum.Create)]
        public async Task<ActionResult> PostAsync(Quotation model)
        {
            if (!this.ModelState.IsValid)
            {
                return this.InvalidModelState(this.ModelState);
            }

            var meta = await AppUsers.GetCurrentAsync().ConfigureAwait(true);

            model.UserId = meta.UserId;
            model.OfficeId = meta.OfficeId;
            model.AuditUserId = meta.UserId;
            model.AuditTs = DateTimeOffset.UtcNow;
            model.TransactionTimestamp = DateTimeOffset.UtcNow;

            try
            {
                long tranId = await Quotations.PostAsync(this.Tenant, model).ConfigureAwait(true);
                return this.Ok(tranId);
            }
            catch (Exception ex)
            {
                return this.Failed(ex.Message, HttpStatusCode.InternalServerError);
            }
        }
    }
}