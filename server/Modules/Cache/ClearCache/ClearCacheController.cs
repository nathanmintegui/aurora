using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Hybrid;

namespace Server.Modules.Cache.ClearCache;

[ApiController]
[Route("/cache")]
public class ClearCacheController(HybridCache hybridCache) : ControllerBase
{
    [HttpGet]
    [Route("clear/{tag}")]
    public async Task<IActionResult> Clear([FromRoute] string tag)
    {
        await hybridCache.RemoveByTagAsync(tag);
        return Ok();
    }
}

