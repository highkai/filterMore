// To parse this JSON data, add NuGet 'Newtonsoft.Json' then do:
//
//    using FilterMore;
//
//    var filterMoreConfig = FilterMoreConfig.FromJson(jsonString);

namespace FilterMore
{
    using System;
    using System.Collections.Generic;

    using System.Globalization;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Converters;

    public partial class FilterMoreConfig
    {
        [JsonProperty("expandRow")]
        public long ExpandRow { get; set; }

        [JsonProperty("isCascade")]
        public bool IsCascade { get; set; }

        [JsonProperty("searchBoxs")]
        public SearchBox[] SearchBoxs { get; set; }
    }

    public partial class SearchBox
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonProperty("type", NullValueHandling = NullValueHandling.Ignore)]
        public string Type { get; set; }

        [JsonProperty("data")]
        public Datum[] Data { get; set; }

        [JsonProperty("isShowAll", NullValueHandling = NullValueHandling.Ignore)]
        public string IsShowAll { get; set; }

        [JsonProperty("isMultiple", NullValueHandling = NullValueHandling.Ignore)]
        public string IsMultiple { get; set; }

        [JsonProperty("fullData", NullValueHandling = NullValueHandling.Ignore)]
        public FullDatum[] FullData { get; set; }

        [JsonProperty("parentId", NullValueHandling = NullValueHandling.Ignore)]
        public string ParentId { get; set; }
    }

    public partial class Datum
    {
        [JsonProperty("value")]
        public string Value { get; set; }

        [JsonProperty("text")]
        public string Text { get; set; }
    }

    public partial class FullDatum
    {
        [JsonProperty("value")]
        public string Value { get; set; }

        [JsonProperty("text")]
        public string Text { get; set; }

        [JsonProperty("parentId", NullValueHandling = NullValueHandling.Ignore)]
        public string ParentId { get; set; }
    }

    public partial class FilterMoreConfig
    {
        public static FilterMoreConfig FromJson(string json) => JsonConvert.DeserializeObject<FilterMoreConfig>(json, FilterMore.Converter.Settings);
    }

    public static class Serialize
    {
        public static string ToJson(this FilterMoreConfig self) => JsonConvert.SerializeObject(self, FilterMore.Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            MetadataPropertyHandling = MetadataPropertyHandling.Ignore,
            DateParseHandling = DateParseHandling.None,
            Converters = {
                new IsoDateTimeConverter { DateTimeStyles = DateTimeStyles.AssumeUniversal }
            },
        };
    }
}
